import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Camera } from 'expo-camera';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [defaultValidationData, setDefaultValidationData] = useState('Testikoodi');
  const [userValidationData, setUserValidationData] = useState('');
  const [scanFrequency, setScanFrequency] = useState(null);
  const frequencies = [{ label: '30s', value: 30000 }, { label: '5m', value: 300000 }, { label: '10m', value: 600000 },{ label: '30m', value: 1800000 }];
  const [scanComplete, setScanComplete] = useState(false); // New state
  const [selectedFrequency, setSelectedFrequency] = useState(null);


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let intervalId;
    if (scanFrequency) {
      intervalId = setInterval(() => {
        setScanned(false); // Allow for a new scan
        setType(prevType => // Switch camera type
          prevType === Camera.Constants.Type.back 
          ? Camera.Constants.Type.front 
          : Camera.Constants.Type.back
        );
      }, scanFrequency);
    }
    return () => clearInterval(intervalId);
  }, [scanFrequency]);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannedData(data);
    let isValid = data === defaultValidationData || data === userValidationData;
    Alert.alert('Barcode Scanned', `Type: ${type}\nData: ${data}\nMatch: ${isValid ? 'Valid' : 'Invalid'}`);
  };

  const initiateScan = () => {
    setScanned(false); // Reset scanned state to allow a new scan
  };


  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  const handleFrequencySelect = (value) => {
    setScanFrequency(value);
    setSelectedFrequency(value); // Update the selected frequency
  };
  return (
    <View style={styles.container}>
      <Camera 
        style={styles.camera} 
        type={type}
        onBarCodeScanned={!scanned ? handleBarCodeScanned : undefined}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}>
            <Text style={styles.text}> Flip Camera </Text>
          </TouchableOpacity>
        </View>
      </Camera>
      <View style={styles.controlPanel}>
        <TextInput
          style={styles.input}
          onChangeText={setUserValidationData}
          value={userValidationData}
          placeholder="Enter validation data"
        />
        {scanned && <Text style={styles.barcodeText}>Scanned Data: {scannedData}</Text>}
        <TouchableOpacity onPress={initiateScan} style={styles.scanButton}>
          <Text style={styles.text}>Scan once</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.frequencyContainer}>
        {frequencies.map(freq => (
          <TouchableOpacity
            key={freq.value}
            onPress={() => handleFrequencySelect(freq.value)}
            style={selectedFrequency === freq.value ? styles.freqButtonSelected : styles.freqButton}
          >
            <Text style={styles.freqText}>{freq.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  camera: {
    flex: 1
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    paddingHorizontal: 30,
    elevation: 3,  // for Android shadow
    shadowOpacity: 0.3,  // for iOS shadow
    shadowRadius: 5,
    shadowOffset: { height: 2, width: 0 },
  },
  text: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center'
  },
  barcodeText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 20
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    color: 'black',
    backgroundColor: 'white',
    borderColor: 'gray',
    borderRadius: 5,
  },
  rescanButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    paddingHorizontal: 30,
    margin: 20,
    elevation: 3,  // for Android shadow
    shadowOpacity: 0.3,  // for iOS shadow
    shadowRadius: 5,
    shadowOffset: { height: 2, width: 0 },
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  freqButton: {
    backgroundColor: '#ddd',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  freqButtonSelected: {
    backgroundColor: '#aaa', // Different color to indicate selection
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  freqText: {
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    paddingHorizontal: 30,
    margin: 20,
    elevation: 3,  // for Android shadow
    shadowOpacity: 0.3,  // for iOS shadow
    shadowRadius: 5,
    shadowOffset: { height: 2, width: 0 },
  },
});
