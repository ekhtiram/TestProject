import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Animated, Alert, ScrollView, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const THEMES = {
  Default: '#FFFFFF',
  Retro: '#FFD700',
  Minimalist: '#d2c4c4',
};

export default function App() {
  const [backgroundColor, setBackgroundColor] = useState(THEMES.Default);
  const [clickCount, setClickCount] = useState(0);
  const [colorHistory, setColorHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoriteCategory, setFavoriteCategory] = useState('General');
  const [categories, setCategories] = useState(['General']);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentColor, setCurrentColor] = useState(THEMES.Default);
  const [manualColor, setManualColor] = useState('');
  const [theme, setTheme] = useState('Default');

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStorageData();
    applyTheme(theme);
  }, []);

  const loadStorageData = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favorites');
      const savedClickCount = await AsyncStorage.getItem('clickCount');
      const savedColorHistory = await AsyncStorage.getItem('colorHistory');
      const savedTheme = await AsyncStorage.getItem('theme');

      if (savedFavorites !== null) setFavorites(JSON.parse(savedFavorites));
      if (savedClickCount !== null) setClickCount(parseInt(savedClickCount));
      if (savedColorHistory !== null) setColorHistory(JSON.parse(savedColorHistory));
      if (savedTheme !== null) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  };

  const saveStorageData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      await AsyncStorage.setItem('clickCount', clickCount.toString());
      await AsyncStorage.setItem('colorHistory', JSON.stringify(colorHistory));
      await AsyncStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  }, [favorites, clickCount, colorHistory, theme]);

  useEffect(() => {
    saveStorageData();
  }, [saveStorageData]);

  const generateRandomColor = useCallback(() => {
    return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
  }, []);

  const getTitleForClickCount = useMemo(() => {
    if (clickCount >= 50) return 'Pro';
    if (clickCount >= 20) return 'Advanced';
    if (clickCount >= 10) return 'Intermediate';
    if (clickCount >= 5) return 'Beginner';
    return 'Newbie';
  }, [clickCount]);

  const handlePress = () => {
    const newColor = generateRandomColor();
    setCurrentColor(newColor);

    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      setBackgroundColor(newColor);
      animatedValue.setValue(0);
    });

    Haptics.selectionAsync();

    setClickCount(prevCount => prevCount + 1);
    setColorHistory(prevHistory => [newColor, ...prevHistory.slice(0, 4)]);
  };

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => !prevMode);
    setBackgroundColor(isDarkMode ? '#FFFFFF' : '#000000');
  }, [isDarkMode]);

  const addToFavorites = () => {
    const newFavorite = { color: backgroundColor, category: favoriteCategory };
    setFavorites([...favorites, newFavorite]);
    Alert.alert('Favorite added!', `Color ${backgroundColor} has been added to your favorites.`);
  };

  const removeFavorite = useCallback((colorToRemove) => {
    setFavorites(favorites.filter(fav => fav.color !== colorToRemove));
    Alert.alert('Favorite removed!', `Color ${colorToRemove} has been removed from your favorites.`);
  }, [favorites]);

  const renderColorHistory = ({ item }) => (
      <TouchableOpacity
          style={[styles.colorHistoryBox, { backgroundColor: item }]}
          onPress={() => setBackgroundColor(item)}
      />
  );

  const renderFavorites = useCallback((category) => {
    return (
        <ScrollView
            horizontal
            style={styles.favoritesContainer}
            contentContainerStyle={styles.favoritesContentContainer}
        >
          {favorites.filter(fav => fav.category === category).map((fav, index) => (
              <View key={index} style={styles.favoriteWrapper}>
                <TouchableOpacity
                    style={[styles.favoriteBox, { backgroundColor: fav.color }]}
                    onPress={() => setBackgroundColor(fav.color)}
                />
                <TouchableOpacity
                    style={styles.removeFavoriteButton}
                    onPress={() => removeFavorite(fav.color)}
                >
                  <Text style={styles.removeText}>X</Text>
                </TouchableOpacity>
              </View>
          ))}
        </ScrollView>
    );
  }, [favorites, removeFavorite]);

  const applyManualColor = () => {
    if (/^#[0-9A-F]{6}$/i.test(manualColor)) {
      setBackgroundColor(manualColor);
      setCurrentColor(manualColor);
      setColorHistory(prevHistory => [manualColor, ...prevHistory.slice(0, 4)]);
      Haptics.selectionAsync();
    } else {
      Alert.alert('Invalid Color', 'Please enter a valid hex color code.');
    }
  };

  const addCategory = useCallback((newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setFavoriteCategory(newCategory);
    }
  }, [categories]);

  const applyTheme = useCallback((selectedTheme) => {
    setBackgroundColor(THEMES[selectedTheme] || THEMES.Default);
    setCurrentColor(THEMES[selectedTheme] || THEMES.Default);
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const interpolatedColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [backgroundColor, currentColor],
  });

  return (
      <TouchableOpacity style={{ flex: 1 }} onPress={handlePress} activeOpacity={1}>
        <Animated.View style={[styles.container, { backgroundColor: interpolatedColor }]}>
          <View style={styles.touchableArea}>
            <Text style={[styles.text, isDarkMode ? styles.textDark : styles.textLight]}>Hello there</Text>
            <Text style={[styles.text, isDarkMode ? styles.textDark : styles.textLight]}>
              You have clicked {clickCount} times
            </Text>
            <Text style={[styles.titleText, isDarkMode ? styles.textDark : styles.textLight]}>
              Title: {getTitleForClickCount}
            </Text>
            <View style={styles.colorDisplayContainer}>
              <Text style={[styles.text, isDarkMode ? styles.textDark : styles.textLight]}>
                Current Color: {currentColor}
              </Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.manualColorContainer}>
              <TextInput
                  style={styles.colorInput}
                  placeholder="Enter hex color code"
                  value={manualColor}
                  onChangeText={setManualColor}
              />
              <Button title="Apply Color" onPress={applyManualColor} />
            </View>

            <View style={styles.categoryInputContainer}>
              <TextInput
                  style={styles.categoryInput}
                  placeholder="New category"
                  onSubmitEditing={(e) => addCategory(e.nativeEvent.text)}
              />
            </View>

            <View style={styles.themeContainer}>
              <Button title="Default Theme" onPress={() => changeTheme('Default')} />
              <Button title="Retro Theme" onPress={() => changeTheme('Retro')} />
              <Button title="Minimalist Theme" onPress={() => changeTheme('Minimalist')} />
            </View>

            {categories.map((category) => (
                <View key={category} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{category} Favorites</Text>
                  {renderFavorites(category)}
                </View>
            ))}
          </View>

          <FlatList
              data={colorHistory}
              renderItem={renderColorHistory}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              style={styles.colorHistoryList}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addToFavorites}>
              <Text style={styles.buttonText}>Add to Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={toggleDarkMode}>
              <Text style={styles.buttonText}>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  touchableArea: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  textLight: {
    color: '#000000',
  },
  textDark: {
    color: '#FFFFFF',
  },
  titleText: {
    fontSize: 20,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorDisplayContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  colorHistoryList: {
    position: 'absolute',
    bottom: 100,
    paddingLeft: 10,
  },
  colorHistoryBox: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  manualColorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  colorInput: {
    height: 40,
    borderColor: '#000000',
    borderWidth: 1,
    padding: 10,
    width: '65%',
  },
  categoryInputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  categoryInput: {
    height: 40,
    borderColor: '#000000',
    borderWidth: 1,
    padding: 10,
    width: '100%',
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 30,
    width: '100%',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  favoritesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  favoritesContentContainer: {
    justifyContent: 'center',
  },
  favoriteWrapper: {
    alignItems: 'center',
    marginRight: 10,
  },
  favoriteBox: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFavoriteButton: {
    position: 'absolute',
    top: 0,
    right: -10,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
});
