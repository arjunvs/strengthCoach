import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/common/Toast';
import { Dashboard } from './pages/Dashboard';
import { WorkoutPage } from './pages/WorkoutPage';
import { WorkoutActive } from './pages/WorkoutActive';
import { WorkoutComplete } from './pages/WorkoutComplete';
import { Progress } from './pages/Progress';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <AppShell>
                <Dashboard />
              </AppShell>
            }
          />
          <Route
            path="/workout"
            element={
              <AppShell>
                <WorkoutPage />
              </AppShell>
            }
          />
          <Route
            path="/workout/active"
            element={
              <AppShell>
                <WorkoutActive />
              </AppShell>
            }
          />
          <Route
            path="/workout/complete"
            element={
              <AppShell>
                <WorkoutComplete />
              </AppShell>
            }
          />
          <Route
            path="/progress"
            element={
              <AppShell>
                <Progress />
              </AppShell>
            }
          />
          <Route
            path="/history"
            element={
              <AppShell>
                <History />
              </AppShell>
            }
          />
          <Route
            path="/settings"
            element={
              <AppShell>
                <Settings />
              </AppShell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
