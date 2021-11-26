import React from 'react'
import { SafeAreaView, ScrollView, StatusBar, Text, useColorScheme, View } from 'react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import { Button, Paragraph, Theme, YStack } from 'tamagui'
import Tamagui from './tamagui.config'

const App = () => {
  const scheme = useColorScheme()
  const isDarkMode = scheme === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }

  return (
    <Tamagui.Provider defaultTheme={scheme}>
      <SafeAreaView style={backgroundStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={backgroundStyle}>
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
            }}>
            <Examples />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Tamagui.Provider>
  )
}

export default App

const Examples = () => {
  return (
    <YStack flex={1} bc="$bg" ai="center" jc="center" space="$7">
      <Theme name="light">
        <TestComponent />
      </Theme>
      <Theme name="pink">
        <TestComponent />
      </Theme>
      <Theme name="dark">
        <TestComponent />
        <Theme name="pink">
          <TestComponent />
        </Theme>
      </Theme>
    </YStack>
  )
}

const TestComponent = () => {
  return (
    <YStack bc="$bg2" space ai="center" jc="center">
      <YStack width={100} height={100} backgroundColor="red" />
      <Paragraph $sm={{ color: 'red' }} size="$6">
        Hello
      </Paragraph>
      <Button>Hello</Button>
    </YStack>
  )
}
