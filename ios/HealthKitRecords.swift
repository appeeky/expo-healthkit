import ExpoModulesCore

internal struct AuthorizationOptions: Record {
  @Field var toRead: [String] = []
  @Field var toShare: [String] = []
}

internal struct QuantityQueryOptions: Record {
  @Field var type: String = ""
  @Field var unit: String = ""
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
}

internal struct CategoryQueryOptions: Record {
  @Field var type: String = ""
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
}

internal struct WorkoutQueryOptions: Record {
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
  @Field var activityType: Int?
}

internal struct StatisticsQueryOptions: Record {
  @Field var type: String = ""
  @Field var unit: String = ""
  @Field var from: String?
  @Field var to: String?
  @Field var options: Int = 0
}

internal struct StatisticsCollectionQueryOptions: Record {
  @Field var type: String = ""
  @Field var unit: String = ""
  @Field var from: String?
  @Field var to: String?
  @Field var options: Int = 0
  @Field var year: Int = 0
  @Field var month: Int = 0
  @Field var day: Int = 0
  @Field var hour: Int = 0
  @Field var minute: Int = 0
  @Field var second: Int = 0
}

internal struct AnchoredQueryOptions: Record {
  @Field var type: String = ""
  @Field var unit: String?
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var anchor: String?
}

internal struct QuantitySampleInput: Record {
  @Field var type: String = ""
  @Field var unit: String = ""
  @Field var value: Double = 0
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var metadata: [String: String]?
}

internal struct CategorySampleInput: Record {
  @Field var type: String = ""
  @Field var value: Int = 0
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var metadata: [String: String]?
}

internal struct WorkoutInput: Record {
  @Field var activityType: Int = 0
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var energyBurned: Double?
  @Field var energyBurnedUnit: String?
  @Field var distance: Double?
  @Field var distanceUnit: String?
  @Field var metadata: [String: String]?
}

internal struct DeleteObjectsOptions: Record {
  @Field var uuid: String?
  @Field var type: String?
  @Field var from: String?
  @Field var to: String?
}

internal struct DateRangeQueryOptions: Record {
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
}

internal struct ElectrocardiogramQueryOptions: Record {
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
  @Field var includeVoltage: Bool = false
}

internal struct ActivitySummaryQueryOptions: Record {
  @Field var from: String?
  @Field var to: String?
}

internal struct ClinicalRecordQueryOptions: Record {
  @Field var type: String = ""
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
}

internal struct WorkoutRouteQueryOptions: Record {
  @Field var workoutUUID: String = ""
}

internal struct CorrelationQueryOptions: Record {
  @Field var type: String = ""
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
}

internal struct CorrelationInput: Record {
  @Field var type: String = ""
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var objects: [QuantitySampleInput] = []
  @Field var metadata: [String: String]?
}

internal struct HeartbeatSeriesQueryOptions: Record {
  @Field var from: String?
  @Field var to: String?
  @Field var limit: Int = 0
  @Field var ascending: Bool = false
  @Field var includeBeats: Bool = true
}

internal struct QuantitySampleRecord: Record {
  @Field var uuid: String = ""
  @Field var type: String = ""
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var value: Double = 0
  @Field var unit: String = ""
  @Field var sourceName: String?
  @Field var sourceId: String?
  @Field var metadata: [String: String]?
}

internal struct CategorySampleRecord: Record {
  @Field var uuid: String = ""
  @Field var type: String = ""
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var value: Int = 0
  @Field var sourceName: String?
  @Field var sourceId: String?
  @Field var metadata: [String: String]?
}

internal struct WorkoutSampleRecord: Record {
  @Field var uuid: String = ""
  @Field var type: String = "HKWorkoutTypeIdentifier"
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var duration: Double = 0
  @Field var workoutActivityType: Int = 0
  @Field var totalEnergyBurned: Double?
  @Field var totalEnergyBurnedUnit: String?
  @Field var totalDistance: Double?
  @Field var totalDistanceUnit: String?
  @Field var sourceName: String?
  @Field var sourceId: String?
  @Field var metadata: [String: String]?
}

internal struct DeletedSampleRecord: Record {
  @Field var uuid: String = ""
  @Field var type: String?
}

internal struct StatisticsRecord: Record {
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var unit: String = ""
  @Field var sum: Double?
  @Field var min: Double?
  @Field var max: Double?
  @Field var average: Double?
  @Field var mostRecent: Double?
}

internal struct AnchoredQueryResultRecord: Record {
  @Field var added: [QuantitySampleRecord] = []
  @Field var deleted: [DeletedSampleRecord] = []
  @Field var anchor: String?
}
