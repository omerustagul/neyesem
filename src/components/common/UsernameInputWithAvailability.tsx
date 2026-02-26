import React, { useEffect, useState } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { CheckCircle, XCircle } from 'lucide-react-native'
import { isUsernameAvailable, isUsernameFormatValid, USERNAME_REGEX } from '../../utils/usernameAvailability'
import { colors } from '../../theme/colors'

type Props = {
  value: string,
  onChange: (v: string) => void,
  placeholder?: string,
  excludeUserId?: string
}

export default function UsernameInputWithAvailability({ value, onChange, placeholder, excludeUserId }: Props) {
  type AvailabilityStatus = 'idle' | 'valid' | 'invalid' | 'loading'
  const [status, setStatus] = useState<AvailabilityStatus>('idle')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!value || value.length < 3) {
      setStatus('idle')
      return
    }
    const fmt = isUsernameFormatValid(value)
    if (!fmt.valid) {
      setStatus('invalid')
      return
    }
    const t = setTimeout(async () => {
      setStatus('loading')
      const ok = await isUsernameAvailable(value, excludeUserId)
      setStatus(ok ? 'valid' : 'invalid')
      setChecking(false)
    }, 350)
    return () => clearTimeout(t)
  }, [value, excludeUserId])

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || 'Kullanıcı adı'}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {status === 'valid' && (
        <CheckCircle size={18} color={"#10b981"} style={styles.icon} />
      )}
      {status === 'invalid' && (
        <XCircle size={18} color={"#ef4444"} style={styles.icon} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  icon: {
    marginLeft: 8,
  },
})
