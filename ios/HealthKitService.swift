import HealthKit

internal final class HealthKitService {
  let store = HKHealthStore()
  var onUpdate: ((String) -> Void)?

  private var observerQueries: [String: HKObserverQuery] = [:]

  func executeQuery(_ query: HKQuery) throws {
    try catchingHealthKit {
      self.store.execute(query)
    }
  }

  func executeQuery<T: Sendable>(_ query: HKQuery, continuation: CheckedContinuation<T, Error>) {
    do {
      try executeQuery(query)
    } catch {
      continuation.resume(throwing: error)
    }
  }

  func isAvailable() -> Bool {
    HKHealthStore.isHealthDataAvailable()
  }

  func requestAuthorization(_ options: AuthorizationOptions) async throws -> Bool {
    try ensureAvailable()

    if options.toRead.isEmpty && options.toShare.isEmpty {
      throw EmptyPermissionsException()
    }

    let readTypes = Set(try options.toRead.map { try HealthKitIdentifiers.objectType(for: $0) })
    let shareTypes = Set(try options.toShare.map { try HealthKitIdentifiers.sampleType(for: $0) })

    return try await withCheckedThrowingContinuation { continuation in
      store.requestAuthorization(toShare: shareTypes, read: readTypes) { success, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: success)
        }
      }
    }
  }

  func authorizationStatus(for identifier: String) throws -> Int {
    try ensureAvailable()
    let type = try HealthKitIdentifiers.objectType(for: identifier)
    return Int(store.authorizationStatus(for: type).rawValue)
  }

  func requestStatusForAuthorization(_ options: AuthorizationOptions) async throws -> Int {
    try ensureAvailable()
    let readTypes = Set(try options.toRead.map { try HealthKitIdentifiers.objectType(for: $0) })
    let shareTypes = Set(try options.toShare.map { try HealthKitIdentifiers.sampleType(for: $0) })

    return try await withCheckedThrowingContinuation { continuation in
      store.getRequestStatusForAuthorization(toShare: shareTypes, read: readTypes) { status, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: Int(status.rawValue))
        }
      }
    }
  }

  func queryQuantitySamples(_ options: QuantityQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let quantityType = try HealthKitIdentifiers.quantityType(for: options.type)
    let unit = try HealthKitIdentifiers.unit(from: options.unit)
    let samples = try await sampleQuery(
      sampleType: quantityType,
      from: options.from,
      to: options.to,
      limit: options.limit,
      ascending: options.ascending
    )

    return samples.compactMap { sample in
      guard let quantitySample = sample as? HKQuantitySample else {
        return nil
      }
      return mapQuantitySample(quantitySample, type: options.type, unit: unit)
    }
  }

  func queryCategorySamples(_ options: CategoryQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let categoryType = try HealthKitIdentifiers.categoryType(for: options.type)
    let samples = try await sampleQuery(
      sampleType: categoryType,
      from: options.from,
      to: options.to,
      limit: options.limit,
      ascending: options.ascending
    )

    return samples.compactMap { sample in
      guard let categorySample = sample as? HKCategorySample else {
        return nil
      }
      return mapCategorySample(categorySample, type: options.type)
    }
  }

  func queryWorkouts(_ options: WorkoutQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    var predicate = try samplePredicate(from: options.from, to: options.to)
    if let activityTypeRaw = options.activityType,
      let activityType = HKWorkoutActivityType(rawValue: UInt(activityTypeRaw))
    {
      let activityPredicate = HKQuery.predicateForWorkouts(with: activityType)
      predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [predicate, activityPredicate].compactMap { $0 })
    }

    let samples = try await executeSampleQuery(
      sampleType: HKObjectType.workoutType(),
      predicate: predicate,
      limit: HealthKitIdentifiers.queryLimit(options.limit),
      ascending: options.ascending
    )

    return samples.compactMap { sample in
      guard let workout = sample as? HKWorkout else {
        return nil
      }
      return mapWorkout(workout)
    }
  }

  func queryStatistics(_ options: StatisticsQueryOptions) async throws -> [String: Any] {
    try ensureAvailable()
    let quantityType = try HealthKitIdentifiers.quantityType(for: options.type)
    let unit = try HealthKitIdentifiers.unit(from: options.unit)
    let predicate = try samplePredicate(from: options.from, to: options.to)
    let statisticsOptions = HealthKitIdentifiers.statisticsOptions(from: options.options, quantityType: quantityType)

    let statistics: HKStatistics? = try await withCheckedThrowingContinuation { continuation in
      let query = HKStatisticsQuery(
        quantityType: quantityType,
        quantitySamplePredicate: predicate,
        options: statisticsOptions
      ) { _, stats, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: stats)
        }
      }
      executeQuery(query, continuation: continuation)
    }

    guard let statistics else {
      let now = HealthKitIdentifiers.isoString(from: Date())
      return [
        "startDate": now,
        "endDate": now,
        "unit": unit.unitString
      ]
    }

    return mapStatistics(statistics, unit: unit)
  }

  func queryStatisticsCollection(_ options: StatisticsCollectionQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let quantityType = try HealthKitIdentifiers.quantityType(for: options.type)
    let unit = try HealthKitIdentifiers.unit(from: options.unit)
    let from = try HealthKitIdentifiers.optionalDate(from: options.from)
      ?? Calendar.current.date(byAdding: .day, value: -7, to: Date())
      ?? Date()
    let to = try HealthKitIdentifiers.optionalDate(from: options.to) ?? Date()
    let statisticsOptions = HealthKitIdentifiers.statisticsOptions(from: options.options, quantityType: quantityType)
    let interval = dateComponents(from: options)
    let anchorDate = Calendar.current.startOfDay(for: from == Date.distantPast ? to : from)

    let collection: HKStatisticsCollection? = try await withCheckedThrowingContinuation { continuation in
      let query = HKStatisticsCollectionQuery(
        quantityType: quantityType,
        quantitySamplePredicate: nil,
        options: statisticsOptions,
        anchorDate: anchorDate,
        intervalComponents: interval
      )
      query.initialResultsHandler = { _, results, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: results)
        }
      }
      executeQuery(query, continuation: continuation)
    }

    var records: [[String: Any]] = []
    collection?.enumerateStatistics(from: from, to: to) { stats, _ in
      records.append(self.mapStatistics(stats, unit: unit))
    }
    return records
  }

  func queryAnchored(_ options: AnchoredQueryOptions) async throws -> [String: Any] {
    try ensureAvailable()
    let sampleType = try HealthKitIdentifiers.sampleType(for: options.type)
    let predicate = try samplePredicate(from: options.from, to: options.to)
    let anchor = try HealthKitIdentifiers.decodeAnchor(options.anchor)
    let unit = try options.unit.map { try HealthKitIdentifiers.unit(from: $0) }

    let result: (added: [HKSample], deleted: [HKDeletedObject], anchor: HKQueryAnchor?) = try await withCheckedThrowingContinuation { continuation in
      let query = HKAnchoredObjectQuery(
        type: sampleType,
        predicate: predicate,
        anchor: anchor,
        limit: HealthKitIdentifiers.queryLimit(options.limit)
      ) { _, added, deleted, newAnchor, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: (added ?? [], deleted ?? [], newAnchor))
        }
      }
      executeQuery(query, continuation: continuation)
    }

    let added = result.added.compactMap { sample -> [String: Any]? in
      guard let quantitySample = sample as? HKQuantitySample, let unit else {
        return nil
      }
      return mapQuantitySample(quantitySample, type: options.type, unit: unit)
    }
    let deleted = result.deleted.map { item in
      ["uuid": item.uuid.uuidString]
    }

    var payload: [String: Any] = [
      "added": added,
      "deleted": deleted
    ]
    if let encoded = try HealthKitIdentifiers.encodeAnchor(result.anchor) {
      payload["anchor"] = encoded
    }
    return payload
  }

  func saveQuantitySample(_ input: QuantitySampleInput) async throws -> String {
    try ensureAvailable()
    let sample = try makeQuantitySample(input)
    try await store.save(sample)
    return sample.uuid.uuidString
  }

  func makeQuantitySample(_ input: QuantitySampleInput) throws -> HKQuantitySample {
    let quantityType = try HealthKitIdentifiers.quantityType(for: input.type)
    let unit = try HealthKitIdentifiers.unit(from: input.unit)
    let start = try HealthKitIdentifiers.date(from: input.startDate)
    let end = try HealthKitIdentifiers.date(from: input.endDate)
    return HKQuantitySample(
      type: quantityType,
      quantity: HKQuantity(unit: unit, doubleValue: input.value),
      start: start,
      end: end,
      metadata: input.metadata
    )
  }

  func saveCategorySample(_ input: CategorySampleInput) async throws -> String {
    try ensureAvailable()
    let categoryType = try HealthKitIdentifiers.categoryType(for: input.type)
    let start = try HealthKitIdentifiers.date(from: input.startDate)
    let end = try HealthKitIdentifiers.date(from: input.endDate)
    let sample = HKCategorySample(
      type: categoryType,
      value: input.value,
      start: start,
      end: end,
      metadata: input.metadata
    )
    try await store.save(sample)
    return sample.uuid.uuidString
  }

  func saveWorkout(_ input: WorkoutInput) async throws -> String {
    try ensureAvailable()
    guard let activityType = HKWorkoutActivityType(rawValue: UInt(input.activityType)) else {
      throw InvalidIdentifierException("workoutActivityType \(input.activityType)")
    }

    let start = try HealthKitIdentifiers.date(from: input.startDate)
    let end = try HealthKitIdentifiers.date(from: input.endDate)
    let energy = try quantity(value: input.energyBurned, unitString: input.energyBurnedUnit ?? "kcal")
    let distance = try quantity(value: input.distance, unitString: input.distanceUnit ?? "m")

    let workout = HKWorkout(
      activityType: activityType,
      start: start,
      end: end,
      duration: end.timeIntervalSince(start),
      totalEnergyBurned: energy,
      totalDistance: distance,
      metadata: input.metadata
    )
    try await store.save(workout)
    return workout.uuid.uuidString
  }

  func deleteObjects(_ options: DeleteObjectsOptions) async throws -> Int {
    try ensureAvailable()
    guard let typeIdentifier = options.type else {
      throw MissingDeleteTypeException()
    }

    let sampleType = try HealthKitIdentifiers.sampleType(for: typeIdentifier)
    var predicates: [NSPredicate] = []

    if let uuidString = options.uuid {
      guard let uuid = UUID(uuidString: uuidString) else {
        throw MissingUuidException()
      }
      predicates.append(HKQuery.predicateForObject(with: uuid))
    }

    if let datePredicate = try samplePredicate(from: options.from, to: options.to) {
      predicates.append(datePredicate)
    }

    let predicate: NSPredicate? = {
      if predicates.isEmpty { return nil }
      if predicates.count == 1 { return predicates[0] }
      return NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
    }()

    return try await withCheckedThrowingContinuation { continuation in
      store.deleteObjects(of: sampleType, predicate: predicate ?? HKQuery.predicateForSamples(withStart: .distantPast, end: Date(), options: [])) { success, deletedCount, error in
        if let error {
          continuation.resume(throwing: error)
        } else if success {
          continuation.resume(returning: Int(deletedCount))
        } else {
          continuation.resume(returning: 0)
        }
      }
    }
  }

  func biologicalSex() throws -> Int {
    try ensureAvailable()
    return try readCharacteristic {
      Int(try store.biologicalSex().biologicalSex.rawValue)
    }
  }

  func bloodType() throws -> Int {
    try ensureAvailable()
    return try readCharacteristic {
      Int(try store.bloodType().bloodType.rawValue)
    }
  }

  func dateOfBirth() throws -> String? {
    try ensureAvailable()
    do {
      let components = try store.dateOfBirthComponents()
      guard let date = Calendar.current.date(from: components) else {
        return nil
      }
      return HealthKitIdentifiers.isoString(from: date)
    } catch {
      if isNoData(error) {
        return nil
      }
      throw error
    }
  }

  func fitzpatrickSkinType() throws -> Int {
    try ensureAvailable()
    return try readCharacteristic {
      Int(try store.fitzpatrickSkinType().skinType.rawValue)
    }
  }

  func wheelchairUse() throws -> Int {
    try ensureAvailable()
    return try readCharacteristic {
      Int(try store.wheelchairUse().wheelchairUse.rawValue)
    }
  }

  func enableBackgroundDelivery(type identifier: String, frequency: Int) async throws -> Bool {
    try ensureAvailable()
    let type = try HealthKitIdentifiers.objectType(for: identifier)
    let updateFrequency = HKUpdateFrequency(rawValue: Int(frequency)) ?? .hourly

    return try await withCheckedThrowingContinuation { continuation in
      store.enableBackgroundDelivery(for: type, frequency: updateFrequency) { success, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: success)
        }
      }
    }
  }

  func disableBackgroundDelivery(type identifier: String) async throws -> Bool {
    try ensureAvailable()
    let type = try HealthKitIdentifiers.objectType(for: identifier)
    return try await withCheckedThrowingContinuation { continuation in
      store.disableBackgroundDelivery(for: type) { success, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: success)
        }
      }
    }
  }

  func disableAllBackgroundDelivery() async throws -> Bool {
    try ensureAvailable()
    return try await withCheckedThrowingContinuation { continuation in
      store.disableAllBackgroundDelivery { success, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: success)
        }
      }
    }
  }

  func startObserving(_ identifiers: [String]) throws {
    try ensureAvailable()
    stopObserving()

    for identifier in identifiers {
      let sampleType = try HealthKitIdentifiers.sampleType(for: identifier)
      let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { [weak self] _, completionHandler, error in
        defer { completionHandler() }
        guard error == nil else {
          return
        }
        self?.onUpdate?(identifier)
      }
      observerQueries[identifier] = query
      try executeQuery(query)
    }
  }

  func stopObserving() {
    for query in observerQueries.values {
      store.stop(query)
    }
    observerQueries.removeAll()
  }

  func ensureAvailable() throws {
    if !isAvailable() {
      throw HealthUnavailableException()
    }
  }

  func sampleQuery(
    sampleType: HKSampleType,
    from: String?,
    to: String?,
    limit: Int,
    ascending: Bool
  ) async throws -> [HKSample] {
    try await executeSampleQuery(
      sampleType: sampleType,
      predicate: try samplePredicate(from: from, to: to),
      limit: HealthKitIdentifiers.queryLimit(limit),
      ascending: ascending
    )
  }

  func executeSampleQuery(
    sampleType: HKSampleType,
    predicate: NSPredicate?,
    limit: Int,
    ascending: Bool
  ) async throws -> [HKSample] {
    let sort = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: ascending)]
    return try await withCheckedThrowingContinuation { continuation in
      let query = HKSampleQuery(
        sampleType: sampleType,
        predicate: predicate,
        limit: limit,
        sortDescriptors: sort
      ) { _, samples, error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(returning: samples ?? [])
        }
      }
      executeQuery(query, continuation: continuation)
    }
  }

  private func samplePredicate(from: String?, to: String?) throws -> NSPredicate? {
    let start = try HealthKitIdentifiers.optionalDate(from: from)
    let end = try HealthKitIdentifiers.optionalDate(from: to)
    if start == nil && end == nil {
      return nil
    }
    return try catchingHealthKit {
      HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
    }
  }

  private func dateComponents(from options: StatisticsCollectionQueryOptions) -> DateComponents {
    var components = DateComponents()
    if options.year != 0 { components.year = options.year }
    if options.month != 0 { components.month = options.month }
    if options.day != 0 { components.day = options.day }
    if options.hour != 0 { components.hour = options.hour }
    if options.minute != 0 { components.minute = options.minute }
    if options.second != 0 { components.second = options.second }
    if components.year == nil && components.month == nil && components.day == nil
      && components.hour == nil && components.minute == nil && components.second == nil
    {
      components.day = 1
    }
    return components
  }

  private func quantity(value: Double?, unitString: String) throws -> HKQuantity? {
    guard let value else {
      return nil
    }
    let unit = try HealthKitIdentifiers.unit(from: unitString)
    return HKQuantity(unit: unit, doubleValue: value)
  }

  func mapQuantitySample(_ sample: HKQuantitySample, type: String? = nil, unit: HKUnit? = nil) -> [String: Any] {
    let resolvedUnit = unit ?? HealthKitIdentifiers.displayUnit(for: sample.quantityType)
    let resolvedType = type ?? sample.quantityType.identifier
    var record: [String: Any] = [
      "uuid": sample.uuid.uuidString,
      "type": resolvedType,
      "startDate": HealthKitIdentifiers.isoString(from: sample.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: sample.endDate),
      "value": sample.quantity.doubleValue(for: resolvedUnit),
      "unit": resolvedUnit.unitString
    ]
    record["sourceName"] = sample.sourceRevision.source.name
    record["sourceId"] = sample.sourceRevision.source.bundleIdentifier
    record["metadata"] = HealthKitIdentifiers.stringifyMetadata(sample.metadata)
    return record
  }

  private func mapCategorySample(_ sample: HKCategorySample, type: String) -> [String: Any] {
    var record: [String: Any] = [
      "uuid": sample.uuid.uuidString,
      "type": type,
      "startDate": HealthKitIdentifiers.isoString(from: sample.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: sample.endDate),
      "value": sample.value
    ]
    record["sourceName"] = sample.sourceRevision.source.name
    record["sourceId"] = sample.sourceRevision.source.bundleIdentifier
    record["metadata"] = HealthKitIdentifiers.stringifyMetadata(sample.metadata)
    return record
  }

  private func mapWorkout(_ workout: HKWorkout) -> [String: Any] {
    var record: [String: Any] = [
      "uuid": workout.uuid.uuidString,
      "type": "HKWorkoutTypeIdentifier",
      "startDate": HealthKitIdentifiers.isoString(from: workout.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: workout.endDate),
      "duration": workout.duration,
      "workoutActivityType": Int(workout.workoutActivityType.rawValue)
    ]
    record["sourceName"] = workout.sourceRevision.source.name
    record["sourceId"] = workout.sourceRevision.source.bundleIdentifier
    record["metadata"] = HealthKitIdentifiers.stringifyMetadata(workout.metadata)

    if let energy = workout.totalEnergyBurned {
      let unit = HKUnit.kilocalorie()
      record["totalEnergyBurned"] = energy.doubleValue(for: unit)
      record["totalEnergyBurnedUnit"] = unit.unitString
    }
    if let distance = workout.totalDistance {
      let unit = HKUnit.meter()
      record["totalDistance"] = distance.doubleValue(for: unit)
      record["totalDistanceUnit"] = unit.unitString
    }
    return record
  }

  private func mapStatistics(_ statistics: HKStatistics, unit: HKUnit) -> [String: Any] {
    var record: [String: Any] = [
      "startDate": HealthKitIdentifiers.isoString(from: statistics.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: statistics.endDate),
      "unit": unit.unitString
    ]
    record["sum"] = statistics.sumQuantity()?.doubleValue(for: unit)
    record["min"] = statistics.minimumQuantity()?.doubleValue(for: unit)
    record["max"] = statistics.maximumQuantity()?.doubleValue(for: unit)
    record["average"] = statistics.averageQuantity()?.doubleValue(for: unit)
    record["mostRecent"] = statistics.mostRecentQuantity()?.doubleValue(for: unit)
    return record
  }

  private func readCharacteristic(_ read: () throws -> Int) throws -> Int {
    do {
      return try read()
    } catch {
      if isNoData(error) {
        return 0
      }
      throw error
    }
  }

  private func isNoData(_ error: Error) -> Bool {
    let nsError = error as NSError
    return nsError.domain == HKErrorDomain && nsError.code == HKError.Code.errorNoData.rawValue
  }
}
