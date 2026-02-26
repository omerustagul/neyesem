import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import UsernameInputWithAvailability from '../../components/common/UsernameInputWithAvailability'

// Simple usage example for integrating UsernameInputWithAvailability
export default function EditProfileUsernameExample() {
  const [username, setUsername] = useState('')
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Kullanıcı Adı</Text>
      <UsernameInputWithAvailability value={username} onChange={setUsername} placeholder="Kullanıcı adını girin" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontSize: 14, marginBottom: 8 }
})
