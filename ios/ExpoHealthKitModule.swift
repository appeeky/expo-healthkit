import ExpoModulesCore

public class ExpoHealthKitModule: Module {
  private let service = HealthKitService()

  public func definition() -> ModuleDefinition {
    Name("ExpoHealthKit")

    Events("onUpdate")

    OnCreate {
      self.service.onUpdate = { type in
        self.sendEvent("onUpdate", [
          "type": type
        ])
      }
    }

    OnDestroy {
      self.service.stopObserving()
    }

    Function("isHealthDataAvailable") {
      self.service.isAvailable()
    }

    AsyncFunction("requestAuthorization") { (options: AuthorizationOptions) in
      try await self.service.requestAuthorization(options)
    }

    AsyncFunction("getAuthorizationStatus") { (identifier: String) in
      try self.service.authorizationStatus(for: identifier)
    }

    AsyncFunction("getRequestStatusForAuthorization") { (options: AuthorizationOptions) in
      try await self.service.requestStatusForAuthorization(options)
    }

    AsyncFunction("queryQuantitySamples") { (options: QuantityQueryOptions) in
      try await self.service.queryQuantitySamples(options)
    }

    AsyncFunction("queryCategorySamples") { (options: CategoryQueryOptions) in
      try await self.service.queryCategorySamples(options)
    }

    AsyncFunction("queryWorkouts") { (options: WorkoutQueryOptions) in
      try await self.service.queryWorkouts(options)
    }

    AsyncFunction("queryElectrocardiograms") { (options: ElectrocardiogramQueryOptions) in
      try await self.service.queryElectrocardiograms(options)
    }

    AsyncFunction("queryActivitySummaries") { (options: ActivitySummaryQueryOptions) in
      try await self.service.queryActivitySummaries(options)
    }

    AsyncFunction("queryClinicalRecords") { (options: ClinicalRecordQueryOptions) in
      try await self.service.queryClinicalRecords(options)
    }

    AsyncFunction("queryAudiograms") { (options: DateRangeQueryOptions) in
      try await self.service.queryAudiograms(options)
    }

    AsyncFunction("queryWorkoutRoute") { (options: WorkoutRouteQueryOptions) in
      try await self.service.queryWorkoutRoute(options)
    }

    AsyncFunction("queryCorrelations") { (options: CorrelationQueryOptions) in
      try await self.service.queryCorrelations(options)
    }

    AsyncFunction("saveCorrelation") { (input: CorrelationInput) in
      try await self.service.saveCorrelation(input)
    }

    AsyncFunction("queryHeartbeatSeries") { (options: HeartbeatSeriesQueryOptions) in
      try await self.service.queryHeartbeatSeries(options)
    }

    AsyncFunction("queryStatistics") { (options: StatisticsQueryOptions) in
      try await self.service.queryStatistics(options)
    }

    AsyncFunction("queryStatisticsCollection") { (options: StatisticsCollectionQueryOptions) in
      try await self.service.queryStatisticsCollection(options)
    }

    AsyncFunction("queryAnchored") { (options: AnchoredQueryOptions) in
      try await self.service.queryAnchored(options)
    }

    AsyncFunction("saveQuantitySample") { (sample: QuantitySampleInput) in
      try await self.service.saveQuantitySample(sample)
    }

    AsyncFunction("saveCategorySample") { (sample: CategorySampleInput) in
      try await self.service.saveCategorySample(sample)
    }

    AsyncFunction("saveWorkout") { (workout: WorkoutInput) in
      try await self.service.saveWorkout(workout)
    }

    AsyncFunction("deleteObjects") { (options: DeleteObjectsOptions) in
      try await self.service.deleteObjects(options)
    }

    AsyncFunction("getBiologicalSex") {
      try self.service.biologicalSex()
    }

    AsyncFunction("getBloodType") {
      try self.service.bloodType()
    }

    AsyncFunction("getDateOfBirth") {
      try self.service.dateOfBirth()
    }

    AsyncFunction("getFitzpatrickSkinType") {
      try self.service.fitzpatrickSkinType()
    }

    AsyncFunction("getWheelchairUse") {
      try self.service.wheelchairUse()
    }

    AsyncFunction("enableBackgroundDelivery") { (type: String, frequency: Int) in
      try await self.service.enableBackgroundDelivery(type: type, frequency: frequency)
    }

    AsyncFunction("disableBackgroundDelivery") { (type: String) in
      try await self.service.disableBackgroundDelivery(type: type)
    }

    AsyncFunction("disableAllBackgroundDelivery") {
      try await self.service.disableAllBackgroundDelivery()
    }

    AsyncFunction("observeTypes") { (types: [String]) in
      try self.service.startObserving(types)
    }

    AsyncFunction("clearObserverQueries") {
      self.service.stopObserving()
    }

    OnStopObserving("onUpdate") {
      self.service.stopObserving()
    }
  }
}
