Pod::Spec.new do |s|
  s.name           = 'ExpoMultipeer'
  s.version        = '1.0.0'
  s.summary        = 'Multipeer Connectivity module for Expo'
  s.description    = 'Enables nearby device discovery and bouquet sharing via Multipeer Connectivity'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  s.frameworks = 'MultipeerConnectivity', 'NearbyInteraction'
end
