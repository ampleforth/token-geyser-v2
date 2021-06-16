import { BigNumber } from "ethers"
import { createContext, useState } from "react"

export const UserInputContext = createContext<{
  userInput: string
  parsedUserInput: BigNumber
  setUserInput: (value: string) => void
  setParsedUserInput: (value: BigNumber) => void
}>({
  userInput: '',
  parsedUserInput: BigNumber.from('0'),
  setUserInput: () => {},
  setParsedUserInput: () => {},
})

export const UserInputContextProvider: React.FC = ({ children }) => {
  const [userInput, setUserInput] = useState<string>('')
  const [parsedUserInput, setParsedUserInput] = useState<BigNumber>(BigNumber.from('0'))

  return (
    <UserInputContext.Provider
      value={{
        userInput,
        setUserInput,
        parsedUserInput,
        setParsedUserInput,
      }}
    >
      {children}
    </UserInputContext.Provider>
  )
}
