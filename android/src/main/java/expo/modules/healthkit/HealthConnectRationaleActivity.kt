package expo.modules.healthkit

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class HealthConnectRationaleActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val padding = (20 * resources.displayMetrics.density).toInt()
    val layout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(padding, padding, padding, padding)
    }

    val title = TextView(this).apply {
      text = "Health Connect"
      textSize = 20f
    }
    val body = TextView(this).apply {
      text =
        "This app reads and writes the health types you approve on the Health Connect permission screen. Data stays on the device unless the app uploads it."
      textSize = 16f
    }
    layout.addView(title)
    layout.addView(body)

    val privacyUrl = privacyPolicyUrl()
    if (!privacyUrl.isNullOrBlank()) {
      val privacy = Button(this).apply {
        text = "Privacy policy"
        setOnClickListener {
          startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(privacyUrl)))
        }
      }
      layout.addView(privacy)
    }

    val close = Button(this).apply {
      text = "Close"
      setOnClickListener { finish() }
    }
    layout.addView(close)
    setContentView(layout)
  }

  private fun privacyPolicyUrl(): String? = try {
    val appInfo = packageManager.getApplicationInfo(packageName, android.content.pm.PackageManager.GET_META_DATA)
    appInfo.metaData?.getString(META_PRIVACY_POLICY)
  } catch (_: Exception) {
    null
  }

  companion object {
    const val META_PRIVACY_POLICY = "expo.modules.healthkit.HEALTH_CONNECT_PRIVACY_POLICY_URL"
  }
}
