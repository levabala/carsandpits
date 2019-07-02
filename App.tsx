import { createStackNavigator, createAppContainer } from "react-navigation";
import RecordingScreen from "./src/screens/RecordingScreen";
import { AppRegistry } from "react-native";

const MainNavigator = createStackNavigator({
  // Home: {screen: HomeScreen},
  Recording: { screen: RecordingScreen }
});

const App = createAppContainer(MainNavigator);

export default App;
