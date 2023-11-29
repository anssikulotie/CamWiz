import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [defaultValidationData, setDefaultValidationData] = useState('Testikoodi');
  const [userValidationData, setUserValidationData] = useState('');
  const [scanFrequency, setScanFrequency] = useState(null);
  const frequencies = [{ label: '30s', value: 30000 }, { label: '5m', value: 300000 }, { label: '10m', value: 600000 },{ label: '30m', value: 1800000 }];
  const [scanComplete, setScanComplete] = useState(false); // New statear
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  
const saveScanningFrequency = async (frequency) => {
  try {
    await AsyncStorage.setItem('scanningFrequency', frequency.toString());
  } catch (error) {
    console.error('Error saving scanning frequency', error);
  }
};
// Call this function when the user sets or changes the scanning frequency

const loadScanningFrequency = async () => {
  try {
    const frequency = await AsyncStorage.getItem('scanningFrequency');
    if (frequency !== null) {
      const freqValue = parseInt(frequency, 10);
      setScanFrequency(freqValue);
      // Update selectedFrequency to reflect the loaded frequency
      setSelectedFrequency(freqValue > 0 ? freqValue : null);
    }
  } catch (error) {
    console.error('Error loading scanning frequency', error);
  }
};

// Call this function in a useEffect hook when the app component mounts
useEffect(() => {
  loadScanningFrequency();
}, []);

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
    
    // Use the state variable 'type' to determine the camera used
    let cameraUsed = type === Camera.Constants.Type.back ? 'Back Camera' : 'Front Camera';
  
    recordScanEvent(data, isValid, cameraUsed);
  
    Alert.alert('Barcode Scanned', `Camera: ${cameraUsed}\nType: ${type}\nData: ${data}\nMatch: ${isValid ? 'Valid' : 'Invalid'}`);
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
    // Check if the log file exists
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
    if (!fileInfo.exists) {
      Alert.alert("No Log File", "The log file does not exist.");
      setIsSharing(false); // Reset sharing status
      return;
    }

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

const deleteLogFile = () => {
  Alert.alert(
    "Delete Log File",
    "Are you sure you want to delete the log file? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => performLogDeletion() } // Call performLogDeletion on confirmation
    ],
    { cancelable: false }
  );
};

const performLogDeletion = async () => {
  const logFileName = 'scan_events.txt';
  const logFilePath = `${FileSystem.documentDirectory}${logFileName}`;

  try {
    // Check if the log file exists
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
    if (!fileInfo.exists) {
      Alert.alert("No Log File", "The log file does not exist and cannot be deleted.");
      return;
    }

    // Proceed to delete the file
    await FileSystem.deleteAsync(logFilePath);
    Alert.alert("Log Deleted", "The log file has been successfully deleted.");
  } catch (error) {
    console.error('Error deleting log file:', error);
    Alert.alert("Delete Error", "There was an error deleting the log file.");
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
      setScanFrequency(null);
      setSelectedFrequency(null);
      saveScanningFrequency('0'); // Indicate no frequency is selected
    } else {
      setScanFrequency(value);
      setSelectedFrequency(value);
      saveScanningFrequency(value.toString()); // Save the selected frequency
    }
  };
  

  const recordScanEvent = async (data, isValid) => {
    const logFileName = 'scan_events.txt';
    const logFilePath = `${FileSystem.documentDirectory}${logFileName}`;
    const timestamp = getFinnishTimestamp();
    
    // Determine the camera used based on the 'type' state
    const cameraUsed = type === Camera.Constants.Type.back ? 'Back Camera' : 'Front Camera';
    
    const logEntry = `${timestamp}, Camera: ${cameraUsed}, Status: ${isValid ? 'Valid' : 'Invalid'}, Data: ${data}\n`;
  
    try {
      // Read existing content and append the new log entry
      const existingContent = await FileSystem.readAsStringAsync(logFilePath).catch(() => '');
      const updatedContent = existingContent + logEntry;
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
        <TouchableOpacity onPress={initiateScan} style={styles.actionButton}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportLogFile} style={styles.actionButton}>
          <Text style={styles.buttonText}>Export Log</Text>
        </TouchableOpacity>
  
        {/* Delete Log Button */}
        <TouchableOpacity onPress={deleteLogFile} style={styles.actionButton}>
          <Text style={styles.buttonText}>Delete Log</Text>
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
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    flex: 1, // Adjust as necessary
    margin: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
