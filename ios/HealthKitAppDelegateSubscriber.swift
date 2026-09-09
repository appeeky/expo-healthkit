import ExpoModulesCore

/// Re-registers persisted HealthKit observer queries as soon as the app process
/// starts, before the JS runtime boots. Required for background delivery to work
/// when iOS relaunches a killed app.
public final class HealthKitAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    HealthKitObserverCenter.shared.restore()
    return true
  }
}
