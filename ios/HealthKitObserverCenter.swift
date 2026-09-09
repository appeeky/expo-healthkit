import HealthKit
import OSLog
import UIKit

private let observerLog = Logger(subsystem: "expo-healthkit", category: "observer")

/// Process-wide owner of `HKObserverQuery`s.
///
/// Lives outside the Expo module instance so observers survive JS reloads and can be
/// re-registered from `application(_:didFinishLaunchingWithOptions:)` before the
/// JS runtime exists. Apple requires observer queries to be running at launch for
/// background delivery to wake a killed app.
///
/// Each delivery is handed to JS as `{ type, token }`. The HealthKit completion handler
/// (plus a `UIBackgroundTask`) is held until JS calls `completeUpdate(token)` or the
/// timeout fires. Events that arrive before JS subscribes are queued and flushed when
/// the module starts observing `onUpdate`.
internal final class HealthKitObserverCenter {
  static let shared = HealthKitObserverCenter()

  private static let observedTypesKey = "expo.healthkit.observedTypes"
  /// iOS grants roughly 30 seconds of background execution per delivery.
  private static let completionTimeout: TimeInterval = 25
  private static let maxQueuedEvents = 64

  private struct PendingUpdate {
    let handler: HKObserverQueryCompletionHandler
    let backgroundTask: UIBackgroundTaskIdentifier
    let timeout: DispatchWorkItem
  }

  private let store = HKHealthStore()
  private let queue = DispatchQueue(label: "expo.healthkit.observer-center")

  private var queries: [String: HKObserverQuery] = [:]
  private var pending: [String: PendingUpdate] = [:]
  private var queuedEvents: [[String: Any]] = []
  private var emitter: (([String: Any]) -> Void)?

  private init() {}

  // MARK: - Public API

  /// Replaces the observed set, persists it, and (re)starts queries.
  func observe(_ identifiers: [String]) throws {
    guard HKHealthStore.isHealthDataAvailable() else {
      throw HealthUnavailableException()
    }
    let sampleTypes = try identifiers.map { ($0, try HealthKitIdentifiers.sampleType(for: $0)) }

    queue.sync {
      UserDefaults.standard.set(identifiers, forKey: Self.observedTypesKey)
      // Same set already running (e.g. restored at launch): don't tear down and
      // re-execute, which would make HealthKit fire every observer again.
      if Set(identifiers) == Set(queries.keys) {
        observerLog.notice("observe: \(identifiers.count) type(s) already running, skipping restart")
        return
      }
      stopAllQueriesLocked()
      for (identifier, sampleType) in sampleTypes {
        startQueryLocked(identifier: identifier, sampleType: sampleType)
      }
    }
  }

  /// Stops all queries and forgets the persisted set.
  func clear() {
    queue.sync {
      stopAllQueriesLocked()
      UserDefaults.standard.removeObject(forKey: Self.observedTypesKey)
    }
  }

  func observedTypes() -> [String] {
    UserDefaults.standard.stringArray(forKey: Self.observedTypesKey) ?? []
  }

  /// Re-registers persisted observers. Safe to call repeatedly; already-running
  /// queries are left alone. Called from the AppDelegate subscriber at launch and
  /// from the module's `OnCreate` as a fallback.
  func restore() {
    guard HKHealthStore.isHealthDataAvailable() else {
      return
    }
    let identifiers = observedTypes()
    guard !identifiers.isEmpty else {
      return
    }

    queue.sync {
      var restored = 0
      for identifier in identifiers where queries[identifier] == nil {
        guard let sampleType = try? HealthKitIdentifiers.sampleType(for: identifier) else {
          continue
        }
        startQueryLocked(identifier: identifier, sampleType: sampleType)
        restored += 1
      }
      observerLog.notice("restore: re-registered \(restored) observer(s), emitter=\(self.emitter != nil)")
    }
  }

  /// Called by JS once its listeners have finished processing a delivery.
  /// Unknown or already-completed tokens are ignored.
  func completeUpdate(token: String) {
    queue.sync {
      finishLocked(token: token, reason: "js")
    }
  }

  /// Wires (or unwires) the JS event sink. Setting a non-nil emitter flushes
  /// any deliveries queued while JS was not listening.
  func setEmitter(_ emitter: (([String: Any]) -> Void)?) {
    queue.sync {
      self.emitter = emitter
      guard let emitter else {
        return
      }
      let events = queuedEvents
      queuedEvents.removeAll()
      observerLog.notice("emitter attached, flushing \(events.count) queued event(s)")
      for event in events {
        emitter(event)
      }
    }
  }

  // MARK: - Internals (must run on `queue`)

  private func startQueryLocked(identifier: String, sampleType: HKSampleType) {
    let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { [weak self] _, completionHandler, error in
      guard let self else {
        completionHandler()
        return
      }
      if error != nil {
        completionHandler()
        return
      }
      self.handleDelivery(identifier: identifier, completionHandler: completionHandler)
    }
    queries[identifier] = query
    store.execute(query)
  }

  private func stopAllQueriesLocked() {
    for query in queries.values {
      store.stop(query)
    }
    queries.removeAll()
  }

  private func handleDelivery(identifier: String, completionHandler: @escaping HKObserverQueryCompletionHandler) {
    let token = UUID().uuidString

    let backgroundTask = UIApplication.shared.beginBackgroundTask(withName: "expo-healthkit.\(identifier)") { [weak self] in
      self?.queue.async {
        self?.finishLocked(token: token, reason: "background-task-expired")
      }
    }

    let timeout = DispatchWorkItem { [weak self] in
      self?.finishLocked(token: token, reason: "timeout")
    }

    queue.async {
      self.pending[token] = PendingUpdate(
        handler: completionHandler,
        backgroundTask: backgroundTask,
        timeout: timeout
      )
      self.queue.asyncAfter(deadline: .now() + Self.completionTimeout, execute: timeout)

      let event: [String: Any] = ["type": identifier, "token": token]
      let appState = UIApplication.shared.applicationState.rawValue
      observerLog.notice("delivery \(token, privacy: .public) for \(identifier, privacy: .public) appState=\(appState) emitter=\(self.emitter != nil)")
      if let emitter = self.emitter {
        emitter(event)
      } else {
        if self.queuedEvents.count >= Self.maxQueuedEvents {
          self.queuedEvents.removeFirst()
        }
        self.queuedEvents.append(event)
      }
    }
  }

  private func finishLocked(token: String, reason: String) {
    guard let update = pending.removeValue(forKey: token) else {
      return
    }
    observerLog.notice("complete \(token, privacy: .public) reason=\(reason, privacy: .public)")
    update.timeout.cancel()
    update.handler()
    if update.backgroundTask != .invalid {
      UIApplication.shared.endBackgroundTask(update.backgroundTask)
    }
  }
}
