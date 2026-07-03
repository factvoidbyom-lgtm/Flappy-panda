#!/bin/bash
set -e

echo "=== Starting Android SDK and Java 17 Setup ==="

# 1. Install Java 17 & utilities non-interactively
echo "=== Installing OpenJDK 17 and dependencies ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
  -o Dpkg::Options::="--force-confdef" \
  -o Dpkg::Options::="--force-confold" \
  openjdk-17-jdk-headless unzip wget curl

# Find Java home dynamically
export JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:/bin/java::")
echo "JAVA_HOME is set to: $JAVA_HOME"
export PATH=$JAVA_HOME/bin:$PATH

# 2. Setup Android SDK Directory
echo "=== Setting up Android SDK directories ==="
mkdir -p /workspace/android-sdk/cmdline-tools

# Remove old files if they exist to prevent errors
rm -rf /workspace/android-sdk/cmdline-tools/latest

# 3. Download Command Line Tools
echo "=== Downloading Android Command Line Tools ==="
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /workspace/android-sdk/cmdline-tools.zip

echo "=== Unpacking Command Line Tools ==="
unzip -q /workspace/android-sdk/cmdline-tools.zip -d /workspace/android-sdk/cmdline-tools
rm /workspace/android-sdk/cmdline-tools.zip

# The cmdline-tools zip contains a folder called 'cmdline-tools'.
# To use sdkmanager, it must be structured as 'cmdline-tools/latest/...'.
mv /workspace/android-sdk/cmdline-tools/cmdline-tools /workspace/android-sdk/cmdline-tools/latest

# 4. Accept licenses
echo "=== Accepting Android Licenses ==="
yes | /workspace/android-sdk/cmdline-tools/latest/bin/sdkmanager --sdk_root=/workspace/android-sdk --licenses

# 5. Install platform-tools, platforms;android-35, and build-tools;35.0.0
echo "=== Installing platform-tools, platforms;android-35, and build-tools;35.0.0 ==="
/workspace/android-sdk/cmdline-tools/latest/bin/sdkmanager --sdk_root=/workspace/android-sdk "platform-tools" "platforms;android-35" "build-tools;35.0.0"

# 6. Configure local.properties
echo "=== Configuring local.properties for the Gradle build ==="
echo "sdk.dir=/workspace/android-sdk" > ./android/local.properties

echo "=== Android SDK and Java 17 Setup Completed Successfully! ==="
