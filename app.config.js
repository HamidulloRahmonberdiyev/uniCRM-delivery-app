/** @type {import('expo/config').ExpoConfig} */
export default {
  expo: {
    name: 'uniGo',
    slug: 'unicrm-delivery',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'unicrmdelivery',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        LSApplicationQueriesSchemes: [
          'yandexnavi',
          'yandexmaps',
          'comgooglemaps',
          'googlemaps',
        ],
      },
    },
    android: {
      icon: './assets/images/icon.png',
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#F4F6F8',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.hamidullo_rahmonberdiyev.unicrmdelivery',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 26,
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
      [
        'react-native-yamap-plus',
        {
          android_useYandexMapKitLite: false,
          ios_useYandexMapKitLite: false,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Buyurtmalargacha masofani hisoblash uchun joylashuvingiz kerak.',
        },
      ],
      [
        'expo-speech-recognition',
        {
          microphonePermission:
            'Ovozli qidiruv uchun mikrofonga ruxsat bering.',
          speechRecognitionPermission:
            'Buyurtmalarni ovoz bilan qidirish uchun nutqni tanish ruxsatini bering.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/icon.png',
          imageWidth: 96,
          resizeMode: 'contain',
          backgroundColor: '#0088CC',
          android: {
            image: './assets/images/icon.png',
            imageWidth: 96,
            resizeMode: 'contain',
            backgroundColor: '#0088CC',
          },
          ios: {
            image: './assets/images/icon.png',
            imageWidth: 96,
            resizeMode: 'contain',
            backgroundColor: '#0088CC',
          },
          dark: {
            backgroundColor: '#0088CC',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '44d454e8-c76c-40d2-93da-ff8b4ba85fdb',
      },
      yandexMapsApiKey: process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY,
    },
  },
};
