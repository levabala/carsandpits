import * as React from "react";
import location from "react-native-location";
import fs from "react-native-fs";
import { Subscription, Location } from "react-native-location/dist/types";
import { View, Text, StatusBar, StyleSheet } from "react-native";
import filesize from "filesize";
import { serialize, deserialize } from "bson";
import { Buffer } from "buffer";
// import {
//   compressToUTF16 as compress,
//   decompressFromUTF16 as decompress
// } from "lz-string";

const STORE_FILE_PATH = `${fs.DocumentDirectoryPath}/data.json`;
const SAVE_INTERVAL = 4900;

export interface IStoreFileStructure {
  lastTimeStamp: number;
  locations: Location[];
}

export interface IProps {
  children?: React.ReactNode;
}

export interface IState {
  locationsRecorderCount: number;
  speed: number;
}

export default class RecordingScreen extends React.Component<IProps, IState> {
  public static navigationOptions = {
    title: "Recording"
  };

  private locationSubscription?: Subscription;
  private locationStamps: Location[] = [];
  private saveFileSize = 0;
  private saveFileLocations = 0;

  constructor(props: IProps) {
    super(props);

    this.state = { locationsRecorderCount: 0, speed: 0 };
  }

  public writeToFile = async () => {
    if (!this.locationStamps.length) return;

    // fs.writeFile(STORE_FILE_PATH, "");

    const fileExists = await fs.exists(STORE_FILE_PATH);
    const emptyFile = {
      lastTimeStamp: 0,
      locations: []
    } as IStoreFileStructure;
    if (!fileExists)
      await fs.write(STORE_FILE_PATH, serialize(emptyFile).toString("base64"));

    let data;
    try {
      data = deserialize(
        Buffer.from(await fs.readFile(STORE_FILE_PATH), "base64")
      ) as IStoreFileStructure;
      if (!data || !data.locations) throw new Error("Invalid save file");
    } catch (e) {
      console.warn(e);
      data = emptyFile;
    }

    data.locations = data.locations.concat(this.locationStamps);

    this.locationStamps = [];
    await fs.writeFile(STORE_FILE_PATH, serialize(data).toString("base64"));

    this.saveFileSize = parseInt((await fs.stat(STORE_FILE_PATH)).size, 10);
    this.saveFileLocations = data.locations.length;
  };

  public componentDidMount() {
    location.configure({
      interval: 500
    });

    location
      .requestPermission({
        android: {
          detail: "fine"
        },
        ios: "always"
      })
      .then(granted => {
        if (!granted) return;

        this.locationSubscription = location.subscribeToLocationUpdates(
          locations => {
            this.locationStamps.push(...locations);
            this.setState({
              locationsRecorderCount: this.locationStamps.length,
              speed: locations[locations.length - 1].speed
            });
          }
        );

        setInterval(this.writeToFile, SAVE_INTERVAL);
      });
  }

  public render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around"
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Text>Locations in buffer: </Text>
            <Text>Movement speed: </Text>
            <Text>Save file size: </Text>
            <Text>Locations saved: </Text>
          </View>
          <View style={{ display: "flex", flexDirection: "column" }}>
            <Text>{this.state.locationsRecorderCount}</Text>
            <Text>{this.state.speed.toFixed(0)}km/h</Text>
            <Text>{filesize(this.saveFileSize)}</Text>
            <Text>{this.saveFileLocations}</Text>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10
  }
});
