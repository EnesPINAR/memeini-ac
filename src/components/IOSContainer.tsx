import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IOSContainerProps {
  children: React.ReactNode;
}

export const IOSContainer: React.FC<IOSContainerProps> = ({ children }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if we should render the iPhone desktop frame
  // Only on web when screen width is larger than standard mobile (e.g. > 500px)
  const isWebDesktop = Platform.OS === 'web' && windowWidth > 500;

  if (!isWebDesktop) {
    return <View style={styles.fullScreen}>{children}</View>;
  }

  return (
    <View style={styles.webWrapper}>
      {/* Background wallpaper/backdrop for desktop */}
      <View style={styles.desktopBackdrop}>
        {/* iPhone 16 Pro Frame */}
        <View style={styles.deviceFrame}>
          {/* Outer Titanium Bezel */}
          <View style={styles.deviceBezel}>
            {/* Screen Viewport */}
            <View style={styles.deviceScreen}>
              {/* iOS Status Bar */}
              <View style={styles.statusBar}>
                {/* Time */}
                <Text style={styles.statusTime}>{currentTime}</Text>

                {/* Dynamic Island */}
                <View style={styles.dynamicIsland}>
                  <View style={styles.cameraLens} />
                  <View style={styles.sensorDot} />
                </View>

                {/* Status Icons: Signal, WiFi, Battery */}
                <View style={styles.statusIcons}>
                  <Ionicons name="cellular" size={14} color="#000000" style={styles.iconGap} />
                  <Ionicons name="wifi" size={15} color="#000000" style={styles.iconGap} />
                  <View style={styles.batteryContainer}>
                    <View style={styles.batteryFill} />
                    <View style={styles.batteryTip} />
                  </View>
                </View>
              </View>

              {/* App Content */}
              <View style={styles.appContent}>{children}</View>

              {/* iOS Home Indicator Bar */}
              <View style={styles.homeIndicatorContainer} pointerEvents="none">
                <View style={styles.homeIndicator} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webWrapper: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopBackdrop: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceFrame: {
    width: 393,
    height: 852,
    borderRadius: 56,
    backgroundColor: '#1E293B',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.45,
    shadowRadius: 50,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  deviceBezel: {
    flex: 1,
    borderRadius: 48,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  deviceScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  statusTime: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#000000',
    letterSpacing: -0.3,
  },
  dynamicIsland: {
    position: 'absolute',
    left: '50%',
    top: 10,
    transform: [{ translateX: -60 }],
    width: 120,
    height: 35,
    backgroundColor: '#000000',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  cameraLens: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  sensorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconGap: {
    marginRight: 6,
  },
  batteryContainer: {
    width: 22,
    height: 12,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryFill: {
    flex: 1,
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 1.5,
  },
  batteryTip: {
    position: 'absolute',
    right: -3.5,
    width: 2,
    height: 4.5,
    backgroundColor: '#000000',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
  appContent: {
    flex: 1,
  },
  homeIndicatorContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  homeIndicator: {
    width: 136,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 3,
  },
});
