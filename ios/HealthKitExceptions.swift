import ExpoModulesCore

internal final class HealthUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "HealthKit is not available on this device"
  }
}

internal final class EmptyPermissionsException: Exception, @unchecked Sendable {
  override var reason: String {
    "Provide at least one HealthKit type in toRead or toShare"
  }
}

internal final class InvalidIdentifierException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Unknown or unsupported HealthKit identifier: \(param)"
  }
}

internal final class InvalidUnitException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Invalid HealthKit unit string: \(param)"
  }
}

internal final class InvalidDateException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Invalid ISO-8601 date: \(param)"
  }
}

internal final class InvalidSampleTypeException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Identifier is not a writable sample type: \(param)"
  }
}

internal final class MissingDeleteTypeException: Exception, @unchecked Sendable {
  override var reason: String {
    "deleteObjects requires a type, optionally with uuid or a date range"
  }
}

internal final class MissingUuidException: Exception, @unchecked Sendable {
  override var reason: String {
    "uuid is not a valid UUID string"
  }
}

internal final class SampleNotFoundException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "No HealthKit sample found for uuid: \(param)"
  }
}

internal final class EmptyCorrelationException: Exception, @unchecked Sendable {
  override var reason: String {
    "saveCorrelation requires at least one quantity object"
  }
}

internal final class HealthKitNativeException: GenericException<String>, @unchecked Sendable {
  override var code: String {
    "ERR_HEALTHKIT_NATIVE"
  }

  override var reason: String {
    param
  }
}

func catchingHealthKit<T>(_ work: () throws -> T) throws -> T {
  var result: Result<T, Error>?
  do {
    try withoutActuallyEscaping(work) { escapingWork in
      try EXUtilities.catchException {
        do {
          result = .success(try escapingWork())
        } catch {
          result = .failure(error)
        }
      }
    }
  } catch {
    throw HealthKitNativeException(healthKitNativeMessage(error))
  }

  switch result {
  case .success(let value):
    return value
  case .failure(let error):
    throw error
  case nil:
    throw HealthKitNativeException("HealthKit failed without a result")
  }
}

private func healthKitNativeMessage(_ error: Error) -> String {
  let nsError = error as NSError
  let name = nsError.domain
  if let description = nsError.userInfo[NSLocalizedDescriptionKey] as? String, !description.isEmpty {
    return name.isEmpty || description.contains(name) ? description : "\(name): \(description)"
  }
  if name.isEmpty {
    return nsError.localizedDescription
  }
  return "HealthKit raised \(name). The query arguments are invalid."
}
