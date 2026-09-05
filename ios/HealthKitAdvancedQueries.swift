import CoreLocation
import HealthKit

extension HealthKitService {
  func queryElectrocardiograms(_ options: ElectrocardiogramQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let samples = try await sampleQuery(
      sampleType: HKObjectType.electrocardiogramType(),
      from: options.from,
      to: options.to,
      limit: options.limit,
      ascending: options.ascending
    )

    var records: [[String: Any]] = []
    for case let ecg as HKElectrocardiogram in samples {
      var record = mapElectrocardiogram(ecg)
      if options.includeVoltage {
        record["voltageMeasurements"] = try await voltageMeasurements(for: ecg)
      }
      records.append(record)
    }
    return records
  }

  func queryAudiograms(_ options: DateRangeQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let samples = try await sampleQuery(
      sampleType: HKObjectType.audiogramSampleType(),
      from: options.from,
      to: options.to,
      limit: options.limit,
      ascending: options.ascending
    )
    return samples.compactMap { sample in
      guard let audiogram = sample as? HKAudiogramSample else {
        return nil
      }
      return mapAudiogram(audiogram)
    }
  }

  func queryActivitySummaries(_ options: ActivitySummaryQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let summaries: [HKActivitySummary] = try await withCheckedThrowingContinuation { continuation in
      do {
        try catchingHealthKit {
          let predicate = try self.activitySummaryPredicate(from: options.from, to: options.to)
          let query = HKActivitySummaryQuery(predicate: predicate) { _, result, error in
            if let error {
              continuation.resume(throwing: error)
            } else {
              continuation.resume(returning: result ?? [])
            }
          }
          self.store.execute(query)
        }
      } catch {
        continuation.resume(throwing: error)
      }
    }
    return summaries.map(mapActivitySummary)
  }

  func queryClinicalRecords(_ options: ClinicalRecordQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let sampleType = try HealthKitIdentifiers.sampleType(for: options.type)
    guard sampleType is HKClinicalType else {
      throw InvalidIdentifierException(options.type)
    }
    let samples = try await sampleQuery(
      sampleType: sampleType,
      from: options.from,
      to: options.to,
      limit: options.limit,
      ascending: options.ascending
    )
    return samples.compactMap { sample in
      guard let record = sample as? HKClinicalRecord else {
        return nil
      }
      return mapClinicalRecord(record)
    }
  }

  func queryWorkoutRoute(_ options: WorkoutRouteQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    guard let uuid = UUID(uuidString: options.workoutUUID) else {
      throw MissingUuidException()
    }

    let workouts = try await executeSampleQuery(
      sampleType: HKObjectType.workoutType(),
      predicate: HKQuery.predicateForObject(with: uuid),
      limit: 1,
      ascending: false
    )
    guard let workout = workouts.first as? HKWorkout else {
      throw SampleNotFoundException(options.workoutUUID)
    }

    let routes = try await executeSampleQuery(
      sampleType: HKSeriesType.workoutRoute(),
      predicate: HKQuery.predicateForObjects(from: workout),
      limit: HKObjectQueryNoLimit,
      ascending: true
    )

    var records: [[String: Any]] = []
    for case let route as HKWorkoutRoute in routes {
      let locations = try await routeLocations(for: route)
      records.append(mapWorkoutRoute(route, locations: locations))
    }
    return records
  }

  func queryCorrelations(_ options: CorrelationQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let sampleType = try HealthKitIdentifiers.sampleType(for: options.type)
    guard sampleType is HKCorrelationType else {
      throw InvalidIdentifierException(options.type)
    }
    let samples = try await sampleQuery(
      sampleType: sampleType,
      from: options.from,
      to: options.to,
      limit: options.limit,
      ascending: options.ascending
    )
    return samples.compactMap { sample in
      guard let correlation = sample as? HKCorrelation else {
        return nil
      }
      return mapCorrelation(correlation)
    }
  }

  func saveCorrelation(_ input: CorrelationInput) async throws -> String {
    try ensureAvailable()
    guard !input.objects.isEmpty else {
      throw EmptyCorrelationException()
    }
    let sampleType = try HealthKitIdentifiers.sampleType(for: input.type)
    guard let correlationType = sampleType as? HKCorrelationType else {
      throw InvalidIdentifierException(input.type)
    }
    let start = try HealthKitIdentifiers.date(from: input.startDate)
    let end = try HealthKitIdentifiers.date(from: input.endDate)
    let objects = Set(try input.objects.map { try makeQuantitySample($0) })
    let correlation = HKCorrelation(
      type: correlationType,
      start: start,
      end: end,
      objects: objects,
      metadata: input.metadata
    )
    try await store.save(correlation)
    return correlation.uuid.uuidString
  }

  func queryHeartbeatSeries(_ options: HeartbeatSeriesQueryOptions) async throws -> [[String: Any]] {
    try ensureAvailable()
    let samples = try await sampleQuery(
      sampleType: HKSeriesType.heartbeat(),
      from: options.from,
      to: options.to,
      limit: options.limit,
      ascending: options.ascending
    )

    var records: [[String: Any]] = []
    for case let series as HKHeartbeatSeriesSample in samples {
      var record = mapHeartbeatSeries(series)
      if options.includeBeats {
        record["beats"] = try await heartbeatBeats(for: series)
      }
      records.append(record)
    }
    return records
  }

  private func mapCorrelation(_ correlation: HKCorrelation) -> [String: Any] {
    let objects = correlation.objects.compactMap { object -> [String: Any]? in
      guard let quantity = object as? HKQuantitySample else {
        return nil
      }
      return mapQuantitySample(quantity)
    }
    var record: [String: Any] = [
      "uuid": correlation.uuid.uuidString,
      "type": correlation.correlationType.identifier,
      "startDate": HealthKitIdentifiers.isoString(from: correlation.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: correlation.endDate),
      "objects": objects
    ]
    record["sourceName"] = correlation.sourceRevision.source.name
    record["sourceId"] = correlation.sourceRevision.source.bundleIdentifier
    record["metadata"] = HealthKitIdentifiers.stringifyMetadata(correlation.metadata)
    return record
  }

  private func mapHeartbeatSeries(_ sample: HKHeartbeatSeriesSample) -> [String: Any] {
    var record: [String: Any] = [
      "uuid": sample.uuid.uuidString,
      "type": "HKDataTypeIdentifierHeartbeatSeries",
      "startDate": HealthKitIdentifiers.isoString(from: sample.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: sample.endDate),
      "count": sample.count
    ]
    record["sourceName"] = sample.sourceRevision.source.name
    record["sourceId"] = sample.sourceRevision.source.bundleIdentifier
    record["metadata"] = HealthKitIdentifiers.stringifyMetadata(sample.metadata)
    return record
  }

  private func heartbeatBeats(for series: HKHeartbeatSeriesSample) async throws -> [[String: Any]] {
    try await withCheckedThrowingContinuation { continuation in
      var beats: [[String: Any]] = []
      var finished = false
      let query = HKHeartbeatSeriesQuery(heartbeatSeries: series) { _, timeSinceStart, precededByGap, done, error in
        if let error {
          guard !finished else { return }
          finished = true
          continuation.resume(throwing: error)
          return
        }
        beats.append([
          "timeSinceSeriesStart": timeSinceStart,
          "precededByGap": precededByGap
        ])
        if done {
          guard !finished else { return }
          finished = true
          continuation.resume(returning: beats)
        }
      }
      executeQuery(query, continuation: continuation)
    }
  }

  private func voltageMeasurements(for electrocardiogram: HKElectrocardiogram) async throws -> [[String: Any]] {
    let microvolt = HKUnit.voltUnit(with: .micro)
    return try await withCheckedThrowingContinuation { continuation in
      var measurements: [[String: Any]] = []
      var finished = false
      let query = HKElectrocardiogramQuery(electrocardiogram) { _, result in
        switch result {
        case .error(let error):
          guard !finished else { return }
          finished = true
          continuation.resume(throwing: error)
        case .measurement(let measurement):
          if let quantity = measurement.quantity(for: .appleWatchSimilarToLeadI) {
            measurements.append([
              "timeSinceSampleStart": measurement.timeSinceSampleStart,
              "voltage": quantity.doubleValue(for: microvolt),
              "unit": "uV"
            ])
          }
        case .done:
          guard !finished else { return }
          finished = true
          continuation.resume(returning: measurements)
        @unknown default:
          guard !finished else { return }
          finished = true
          continuation.resume(returning: measurements)
        }
      }
      executeQuery(query, continuation: continuation)
    }
  }

  private func routeLocations(for route: HKWorkoutRoute) async throws -> [CLLocation] {
    try await withCheckedThrowingContinuation { continuation in
      var locations: [CLLocation] = []
      var finished = false
      let query = HKWorkoutRouteQuery(route: route) { _, batch, done, error in
        if let error {
          guard !finished else { return }
          finished = true
          continuation.resume(throwing: error)
          return
        }
        if let batch {
          locations.append(contentsOf: batch)
        }
        if done {
          guard !finished else { return }
          finished = true
          continuation.resume(returning: locations)
        }
      }
      executeQuery(query, continuation: continuation)
    }
  }

  private func activitySummaryPredicate(from: String?, to: String?) throws -> NSPredicate? {
    let start = try HealthKitIdentifiers.optionalDate(from: from)
    let end = try HealthKitIdentifiers.optionalDate(from: to)
    guard start != nil || end != nil else {
      return nil
    }

    var calendar = Calendar.current
    calendar.timeZone = TimeZone.current

    let startDate = start ?? calendar.startOfDay(for: end ?? Date())
    let endDate = end ?? Date()
    let earlier = min(startDate, endDate)
    let later = max(startDate, endDate)

    var startComponents = calendar.dateComponents([.era, .year, .month, .day], from: earlier)
    var endComponents = calendar.dateComponents([.era, .year, .month, .day], from: later)
    startComponents.calendar = calendar
    endComponents.calendar = calendar
    startComponents.timeZone = calendar.timeZone
    endComponents.timeZone = calendar.timeZone
    return try catchingHealthKit {
      HKQuery.predicate(forActivitySummariesBetweenStart: startComponents, end: endComponents)
    }
  }

  private func mapElectrocardiogram(_ sample: HKElectrocardiogram) -> [String: Any] {
    var record: [String: Any] = [
      "uuid": sample.uuid.uuidString,
      "type": "HKElectrocardiogramTypeIdentifier",
      "startDate": HealthKitIdentifiers.isoString(from: sample.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: sample.endDate),
      "classification": Int(sample.classification.rawValue),
      "symptomsStatus": Int(sample.symptomsStatus.rawValue),
      "numberOfVoltageMeasurements": sample.numberOfVoltageMeasurements
    ]
    if let heartRate = sample.averageHeartRate {
      record["averageHeartRate"] = heartRate.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
    }
    if let frequency = sample.samplingFrequency {
      record["samplingFrequency"] = frequency.doubleValue(for: .hertz())
    }
    record["sourceName"] = sample.sourceRevision.source.name
    record["sourceId"] = sample.sourceRevision.source.bundleIdentifier
    record["metadata"] = HealthKitIdentifiers.stringifyMetadata(sample.metadata)
    return record
  }

  private func mapAudiogram(_ sample: HKAudiogramSample) -> [String: Any] {
    let hertz = HKUnit.hertz()
    let hearingLevel = HKUnit.decibelHearingLevel()
    let points: [[String: Any]] = sample.sensitivityPoints.map { point in
      var item: [String: Any] = [
        "frequency": point.frequency.doubleValue(for: hertz)
      ]
      var left = point.leftEarSensitivity?.doubleValue(for: hearingLevel)
      var right = point.rightEarSensitivity?.doubleValue(for: hearingLevel)
      if #available(iOS 18.1, *) {
        for test in point.tests {
          let value = test.sensitivity.doubleValue(for: hearingLevel)
          switch test.side {
          case .left:
            left = left ?? value
          case .right:
            right = right ?? value
          @unknown default:
            break
          }
        }
      }
      if let left {
        item["leftEarSensitivity"] = left
      }
      if let right {
        item["rightEarSensitivity"] = right
      }
      return item
    }

    var record: [String: Any] = [
      "uuid": sample.uuid.uuidString,
      "type": "HKAudiogramSampleTypeIdentifier",
      "startDate": HealthKitIdentifiers.isoString(from: sample.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: sample.endDate),
      "sensitivityPoints": points
    ]
    record["sourceName"] = sample.sourceRevision.source.name
    record["sourceId"] = sample.sourceRevision.source.bundleIdentifier
    record["metadata"] = HealthKitIdentifiers.stringifyMetadata(sample.metadata)
    return record
  }

  private func mapActivitySummary(_ summary: HKActivitySummary) -> [String: Any] {
    let energy = HKUnit.kilocalorie()
    let minute = HKUnit.minute()
    let count = HKUnit.count()
    let components = summary.dateComponents(for: Calendar.current)
    let date = String(
      format: "%04d-%02d-%02d",
      components.year ?? 0,
      components.month ?? 0,
      components.day ?? 0
    )

    var record: [String: Any] = [
      "date": date,
      "activeEnergyBurned": summary.activeEnergyBurned.doubleValue(for: energy),
      "appleExerciseTime": summary.appleExerciseTime.doubleValue(for: minute),
      "appleStandHours": summary.appleStandHours.doubleValue(for: count),
      "activeEnergyBurnedGoal": summary.activeEnergyBurnedGoal.doubleValue(for: energy),
      "appleExerciseTimeGoal": summary.appleExerciseTimeGoal.doubleValue(for: minute),
      "appleStandHoursGoal": summary.appleStandHoursGoal.doubleValue(for: count)
    ]
    record["appleMoveTime"] = summary.appleMoveTime.doubleValue(for: minute)
    record["appleMoveTimeGoal"] = summary.appleMoveTimeGoal.doubleValue(for: minute)
    return record
  }

  private func mapClinicalRecord(_ sample: HKClinicalRecord) -> [String: Any] {
    var record: [String: Any] = [
      "uuid": sample.uuid.uuidString,
      "type": sample.clinicalType.identifier,
      "startDate": HealthKitIdentifiers.isoString(from: sample.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: sample.endDate),
      "displayName": sample.displayName
    ]
    if let fhir = sample.fhirResource {
      record["fhirResourceType"] = fhir.resourceType.rawValue
      record["fhirJson"] = String(data: fhir.data, encoding: .utf8)
    }
    record["sourceName"] = sample.sourceRevision.source.name
    record["sourceId"] = sample.sourceRevision.source.bundleIdentifier
    return record
  }

  private func mapWorkoutRoute(_ route: HKWorkoutRoute, locations: [CLLocation]) -> [String: Any] {
    [
      "uuid": route.uuid.uuidString,
      "type": "HKWorkoutRouteTypeIdentifier",
      "startDate": HealthKitIdentifiers.isoString(from: route.startDate),
      "endDate": HealthKitIdentifiers.isoString(from: route.endDate),
      "locations": locations.map { location -> [String: Any] in
        var point: [String: Any] = [
          "latitude": location.coordinate.latitude,
          "longitude": location.coordinate.longitude,
          "timestamp": HealthKitIdentifiers.isoString(from: location.timestamp)
        ]
        if location.verticalAccuracy >= 0 {
          point["altitude"] = location.altitude
        }
        if location.speed >= 0 {
          point["speed"] = location.speed
        }
        if location.course >= 0 {
          point["course"] = location.course
        }
        return point
      }
    ]
  }
}
