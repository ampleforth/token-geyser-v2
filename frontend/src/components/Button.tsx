import { Spinner } from './Spinner'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
}

export const Button: React.FC<Props> = (props) => {
  const { isLoading, children } = props
  return (
    <button type="button" {...props}>
      {isLoading && <Spinner />}
      {children}
    </button>
  )
}
