require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoHealthKit'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.license        = package['license']
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://github.com/appeeky/expo-healthkit.git', tag: "v#{s.version}" }
  s.static_framework = true
  s.frameworks     = 'HealthKit', 'CoreLocation'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
  s.resource_bundles = {
    'ExpoHealthKit_privacy' => ['PrivacyInfo.xcprivacy']
  }
end
