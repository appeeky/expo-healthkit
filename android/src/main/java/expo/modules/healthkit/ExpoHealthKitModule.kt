package expo.modules.healthkit

import android.app.Activity
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions
import androidx.health.connect.client.PermissionController
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class ExpoHealthKitModule : Module() {
  private lateinit var service: HealthConnectService
  private var permissionContinuation: CancellableContinuation<Set<String>>? = null
  private val permissionContract = PermissionController.createRequestPermissionResultContract()

  override fun definition() = ModuleDefinition {
    Name("ExpoHealthKit")

    Events("onUpdate")

    OnCreate {
      val context = appContext.reactContext ?: appContext.throwingActivity.applicationContext
      service = HealthConnectService(context) { permissions ->
        requestHealthPermissions(permissions)
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST_PERMISSIONS) {
        return@OnActivityResult
      }
      val granted = permissionContract.parseResult(payload.resultCode, payload.data)
      val continuation = permissionContinuation
      permissionContinuation = null
      continuation?.resume(granted)
    }

    Function("isHealthDataAvailable") {
      HealthConnectService.isAvailable(appContext.reactContext)
    }

    AsyncFunction("requestAuthorization") Coroutine { options: Map<String, Any?> ->
      service.requestAuthorization(options)
    }

    AsyncFunction("getAuthorizationStatus") Coroutine { identifier: String ->
      service.authorizationStatus(identifier)
    }

    AsyncFunction("getRequestStatusForAuthorization") Coroutine { options: Map<String, Any?> ->
      service.requestStatusForAuthorization(options)
    }

    AsyncFunction("queryQuantitySamples") Coroutine { options: Map<String, Any?> ->
      service.queryQuantitySamples(options)
    }

    AsyncFunction("queryCategorySamples") Coroutine { options: Map<String, Any?> ->
      service.queryCategorySamples(options)
    }

    AsyncFunction("queryWorkouts") Coroutine { options: Map<String, Any?> ->
      service.queryWorkouts(options)
    }

    AsyncFunction("queryElectrocardiograms") { _: Map<String, Any?> ->
      service.unsupported("Electrocardiograms")
    }

    AsyncFunction("queryActivitySummaries") { _: Map<String, Any?> ->
      service.unsupported("Activity rings")
    }

    AsyncFunction("queryClinicalRecords") { _: Map<String, Any?> ->
      service.unsupported("Clinical records")
    }

    AsyncFunction("queryAudiograms") { _: Map<String, Any?> ->
      service.unsupported("Audiograms")
    }

    AsyncFunction("queryWorkoutRoute") { _: Map<String, Any?> ->
      service.unsupported("Workout GPS routes")
    }

    AsyncFunction("queryCorrelations") Coroutine { options: Map<String, Any?> ->
      service.queryCorrelations(options)
    }

    AsyncFunction("queryHeartbeatSeries") { _: Map<String, Any?> ->
      service.unsupported("Heartbeat series")
    }

    AsyncFunction("queryStatistics") Coroutine { options: Map<String, Any?> ->
      service.queryStatistics(options)
    }

    AsyncFunction("queryStatisticsCollection") Coroutine { options: Map<String, Any?> ->
      service.queryStatisticsCollection(options)
    }

    AsyncFunction("queryAnchored") Coroutine { options: Map<String, Any?> ->
      service.queryAnchored(options)
    }

    AsyncFunction("saveQuantitySample") Coroutine { sample: Map<String, Any?> ->
      service.saveQuantitySample(sample)
    }

    AsyncFunction("saveCategorySample") Coroutine { sample: Map<String, Any?> ->
      service.saveCategorySample(sample)
    }

    AsyncFunction("saveWorkout") Coroutine { workout: Map<String, Any?> ->
      service.saveWorkout(workout)
    }

    AsyncFunction("saveCorrelation") Coroutine { correlation: Map<String, Any?> ->
      service.saveCorrelation(correlation)
    }

    AsyncFunction("deleteObjects") Coroutine { options: Map<String, Any?> ->
      service.deleteObjects(options)
    }

    AsyncFunction("getBiologicalSex") {
      service.unsupported("Biological sex")
    }

    AsyncFunction("getBloodType") {
      service.unsupported("Blood type")
    }

    AsyncFunction("getDateOfBirth") {
      service.unsupported("Date of birth")
    }

    AsyncFunction("getFitzpatrickSkinType") {
      service.unsupported("Fitzpatrick skin type")
    }

    AsyncFunction("getWheelchairUse") {
      service.unsupported("Wheelchair use")
    }

    AsyncFunction("enableBackgroundDelivery") { _: String, _: Int ->
      service.unsupported("Background delivery")
    }

    AsyncFunction("disableBackgroundDelivery") { _: String ->
      service.unsupported("Background delivery")
    }

    AsyncFunction("disableAllBackgroundDelivery") {
      service.unsupported("Background delivery")
    }

    AsyncFunction("observeTypes") { _: List<String> ->
      service.unsupported("Observer queries")
    }

    AsyncFunction("clearObserverQueries") {
      Unit
    }
  }

  private suspend fun requestHealthPermissions(permissions: Set<String>): Set<String> {
    val activity: Activity = appContext.throwingActivity
    val intent = permissionContract.createIntent(activity, permissions)
    return withContext(Dispatchers.Main) {
      if (intent.action == RequestMultiplePermissions.ACTION_REQUEST_PERMISSIONS) {
        val platformPermissions =
          intent.getStringArrayExtra(RequestMultiplePermissions.EXTRA_PERMISSIONS)?.toSet()
            ?: permissions
        requestPlatformPermissions(platformPermissions)
      } else {
        requestHealthConnectActivityPermissions(activity, intent)
      }
    }
  }

  private suspend fun requestPlatformPermissions(permissions: Set<String>): Set<String> {
    val manager = appContext.permissions ?: throw HealthKitUnavailableException()
    return suspendCancellableCoroutine { continuation ->
      manager.askForPermissions(
        { responses ->
          if (continuation.isActive) {
            continuation.resume(
              responses.filter { it.value.status == PermissionsStatus.GRANTED }.keys.toSet()
            )
          }
        },
        *permissions.toTypedArray()
      )
    }
  }

  private suspend fun requestHealthConnectActivityPermissions(
    activity: Activity,
    intent: Intent
  ): Set<String> =
    suspendCancellableCoroutine { continuation ->
      permissionContinuation?.cancel()
      permissionContinuation = continuation
      continuation.invokeOnCancellation {
        if (permissionContinuation === continuation) {
          permissionContinuation = null
        }
      }
      try {
        activity.startActivityForResult(intent, REQUEST_PERMISSIONS)
      } catch (error: Exception) {
        permissionContinuation = null
        continuation.resumeWithException(error)
      }
    }

  companion object {
    private const val REQUEST_PERMISSIONS = 0x484B
  }
}
