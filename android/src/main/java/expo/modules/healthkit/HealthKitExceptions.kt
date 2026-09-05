package expo.modules.healthkit

import expo.modules.kotlin.exception.CodedException

internal class HealthKitUnavailableException :
  CodedException("Health data is not available. On iOS use a development build with HealthKit. On Android install Health Connect.")

internal class EmptyPermissionsException :
  CodedException("Provide at least one HealthKit type in toRead or toShare")

internal class InvalidIdentifierException(identifier: String) :
  CodedException("Unknown or unsupported HealthKit identifier: $identifier")

internal class InvalidUnitException(unit: String) :
  CodedException("Invalid HealthKit unit string: $unit")

internal class InvalidDateException(value: String) :
  CodedException("Invalid ISO-8601 date: $value")

internal class InvalidSampleTypeException(identifier: String) :
  CodedException("Identifier is not a writable sample type: $identifier")

internal class MissingDeleteTypeException :
  CodedException("deleteObjects requires a type, optionally with uuid or a date range")

internal class EmptyCorrelationException :
  CodedException("saveCorrelation requires at least one quantity object")

internal class HealthConnectUnsupportedException(feature: String) :
  CodedException("$feature is not available on Android Health Connect")
