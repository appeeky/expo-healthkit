import HealthKit

internal enum HealthKitIdentifiers {
  static func objectType(for identifier: String) throws -> HKObjectType {
    if identifier == "HKWorkoutTypeIdentifier" {
      return HKObjectType.workoutType()
    }

    if identifier.hasPrefix("HKQuantityTypeIdentifier"),
      let type = HKObjectType.quantityType(forIdentifier: HKQuantityTypeIdentifier(rawValue: identifier))
    {
      return type
    }

    if identifier.hasPrefix("HKCategoryTypeIdentifier"),
      let type = HKObjectType.categoryType(forIdentifier: HKCategoryTypeIdentifier(rawValue: identifier))
    {
      return type
    }

    if identifier.hasPrefix("HKCharacteristicTypeIdentifier"),
      let type = HKObjectType.characteristicType(forIdentifier: HKCharacteristicTypeIdentifier(rawValue: identifier))
    {
      return type
    }

    if identifier.hasPrefix("HKCorrelationTypeIdentifier"),
      let type = HKObjectType.correlationType(forIdentifier: HKCorrelationTypeIdentifier(rawValue: identifier))
    {
      return type
    }

    if identifier == "HKElectrocardiogramTypeIdentifier" {
      return HKObjectType.electrocardiogramType()
    }

    if identifier == "HKAudiogramSampleTypeIdentifier" {
      return HKObjectType.audiogramSampleType()
    }

    if identifier == "HKWorkoutRouteTypeIdentifier" {
      return HKSeriesType.workoutRoute()
    }

    if identifier == "HKDataTypeIdentifierHeartbeatSeries" {
      return HKSeriesType.heartbeat()
    }

    if identifier == "HKActivitySummaryTypeIdentifier" {
      return HKObjectType.activitySummaryType()
    }

    if identifier.hasPrefix("HKClinicalTypeIdentifier"),
      let type = HKObjectType.clinicalType(forIdentifier: HKClinicalTypeIdentifier(rawValue: identifier))
    {
      return type
    }

    throw InvalidIdentifierException(identifier)
  }

  static func sampleType(for identifier: String) throws -> HKSampleType {
    guard let type = try objectType(for: identifier) as? HKSampleType else {
      throw InvalidSampleTypeException(identifier)
    }
    return type
  }

  static func quantityType(for identifier: String) throws -> HKQuantityType {
    guard let type = try objectType(for: identifier) as? HKQuantityType else {
      throw InvalidIdentifierException(identifier)
    }
    return type
  }

  static func categoryType(for identifier: String) throws -> HKCategoryType {
    guard let type = try objectType(for: identifier) as? HKCategoryType else {
      throw InvalidIdentifierException(identifier)
    }
    return type
  }

  static func unit(from string: String) throws -> HKUnit {
    let unit = HKUnit(from: string)
    if unit.unitString.isEmpty {
      throw InvalidUnitException(string)
    }
    return unit
  }

  static func date(from value: String) throws -> Date {
    let withFractional = ISO8601DateFormatter()
    withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = withFractional.date(from: value) {
      return date
    }

    let withoutFractional = ISO8601DateFormatter()
    withoutFractional.formatOptions = [.withInternetDateTime]
    if let date = withoutFractional.date(from: value) {
      return date
    }

    throw InvalidDateException(value)
  }

  static func optionalDate(from value: String?) throws -> Date? {
    guard let value else {
      return nil
    }
    return try date(from: value)
  }

  static func isoString(from date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.string(from: date)
  }

  static func queryLimit(_ limit: Int) -> Int {
    limit <= 0 ? HKObjectQueryNoLimit : limit
  }

  static func statisticsOptions(from raw: Int, quantityType: HKQuantityType) -> HKStatisticsOptions {
    if raw == 0 {
      return quantityType.aggregationStyle == .cumulative ? .cumulativeSum : .discreteAverage
    }

    var options: HKStatisticsOptions = []
    if raw & 1 != 0 { options.insert(.discreteAverage) }
    if raw & 2 != 0 { options.insert(.discreteMin) }
    if raw & 4 != 0 { options.insert(.discreteMax) }
    if raw & 8 != 0 { options.insert(.cumulativeSum) }
    if raw & 32 != 0 { options.insert(.discreteMostRecent) }
    return options
  }

  static func displayUnit(for quantityType: HKQuantityType) -> HKUnit {
    let candidates: [HKUnit] = [
      HKUnit.millimeterOfMercury(),
      HKUnit.percent(),
      HKUnit.count().unitDivided(by: .minute()),
      HKUnit.count(),
      HKUnit.kilocalorie(),
      HKUnit.internationalUnit(),
      HKUnit.gram(),
      HKUnit.literUnit(with: .milli),
      HKUnit.meter(),
      HKUnit.degreeCelsius(),
      HKUnit.siemenUnit(with: .micro),
      HKUnit.decibelAWeightedSoundPressureLevel(),
      HKUnit.second()
    ]
    return candidates.first { quantityType.is(compatibleWith: $0) } ?? HKUnit.count()
  }

  static func stringifyMetadata(_ metadata: [String: Any]?) -> [String: String]? {
    guard let metadata, !metadata.isEmpty else {
      return nil
    }

    var result: [String: String] = [:]
    for (key, value) in metadata {
      result[key] = String(describing: value)
    }
    return result
  }

  static func encodeAnchor(_ anchor: HKQueryAnchor?) throws -> String? {
    guard let anchor else {
      return nil
    }
    let data = try NSKeyedArchiver.archivedData(withRootObject: anchor, requiringSecureCoding: true)
    return data.base64EncodedString()
  }

  static func decodeAnchor(_ value: String?) throws -> HKQueryAnchor? {
    guard let value, let data = Data(base64Encoded: value) else {
      return nil
    }
    return try NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: data)
  }
}
