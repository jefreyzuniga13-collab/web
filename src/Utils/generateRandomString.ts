export const generateRandomString = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numberChars = "0123456789"
  let result = ""
  let hasUppercase = false
  let hasNumber = false

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    const char = characters[randomIndex]
    result += char
    if (uppercaseChars.includes(char)) hasUppercase = true
    if (numberChars.includes(char)) hasNumber = true
  }

  if (!hasUppercase) {
    result =
      result.substring(0, Math.floor(Math.random() * 6)) +
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)] +
      result.substring(Math.floor(Math.random() * 6) + 1)
  }
  if (!hasNumber) {
    result =
      result.substring(0, Math.floor(Math.random() * 6)) +
      numberChars[Math.floor(Math.random() * numberChars.length)] +
      result.substring(Math.floor(Math.random() * 6) + 1)
  }

  return result
}