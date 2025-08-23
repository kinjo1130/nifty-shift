import LoginButton from './components/LoginButton'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Nifty Shift</h1>
      <p className="mt-4 text-lg text-gray-600">Welcome to Nifty Shift Application</p>
      <div className="mt-8">
        <LoginButton />
      </div>
    </main>
  )
}