import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
  const getFinnishTimestamp = () => {
    return new Intl.DateTimeFormat('fi-FI', {
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }).format(new Date());
  };
  

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
    
    // Record the scan event
    recordScanEvent(data, isValid);
  
    Alert.alert('Barcode Scanned', `Type: ${type}\nData: ${data}\nMatch: ${isValid ? 'Valid' : 'Invalid'}`);
  };

  const initiateScan = () => {
    setScanned(false); // Reset scanned state to allow a new scan
  };

  const [isSharing, setIsSharing] = useState(false); // State to track sharing status

const exportLogFile = async () => {
  if (isSharing) {
    console.log('A share request is already in progress.');
    return;
  }

  setIsSharing(true); // Set sharing status to true

  const logFileName = 'scan_events.txt';
  const logFilePath = `${FileSystem.documentDirectory}${logFileName}`;

  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing not available", "Unable to share files on this device.");
      setIsSharing(false); // Reset sharing status
      return;
    }

    await Sharing.shareAsync(logFilePath);
  } catch (error) {
    console.error('Error sharing log file:', error);
    Alert.alert("Export Error", "There was an error exporting the log file.");
  } finally {
    setIsSharing(false); // Reset sharing status regardless of outcome
  }
};


  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  const handleFrequencySelect = (value) => {
    if (scanFrequency === value) {
      // If the selected frequency is already active, disable scanning
      setScanFrequency(null);
      setSelectedFrequency(null);
    } else {
      // Otherwise, activate the selected frequency
      setScanFrequency(value);
      setSelectedFrequency(value);
    }
  };

  const recordScanEvent = async (data, isValid) => {
    const logFileName = 'scan_events.txt';
    const logFilePath = `${FileSystem.documentDirectory}${logFileName}`;
    const timestamp = getFinnishTimestamp(); // Finnish formatted timestamp
    const newLogEntry = `${timestamp}, Status: ${isValid ? 'Valid' : 'Invalid'}, Data: ${data}\n`;
  
    try {
      // Read existing content
      const existingContent = await FileSystem.readAsStringAsync(logFilePath)
        .catch(() => ''); // If the file doesn't exist, start with an empty string
  
      // Concatenate new entry with existing content
      const updatedContent = existingContent + newLogEntry;
  
      // Write the updated content back to the file
      await FileSystem.writeAsStringAsync(logFilePath, updatedContent);
    } catch (error) {
      console.error('Error writing scan event:', error);
    }
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
          placeholder="Enter validation data. Testikoodi is set as default."
        />
        {scanned && <Text style={styles.barcodeText}>Scanned Data: {scannedData}</Text>}
      </View>
  
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={initiateScan} style={styles.scanButton}>
          <Text style={styles.buttonText}>Scan Once</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportLogFile} style={styles.exportButton}>
          <Text style={styles.buttonText}>Export Log File</Text>
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
    backgroundColor: 'green', // Different color to indicate selection
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  freqText: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flex: 1, // Take up half of the space
    margin: 5,
  },
  exportButton: {
    backgroundColor: '#008CBA',
    padding: 15,
    borderRadius: 10,
    flex: 1, // Take up half of the space
    margin: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
