import React from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DeviceEnrollment from './pages/DeviceEnrollment';
import IntentTokens from './pages/IntentTokens';
import CapsuleAccess from './pages/CapsuleAccess';
import SecurityEvents from './pages/SecurityEvents';
import AdminPanel from './pages/AdminPanel';

const routes = [
  <Route path="/login" element={<Login />} key="login" />,
  <Route path="/register" element={<Register />} key="register" />,
  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} key="dashboard" />,
  <Route path="/devices" element={<PrivateRoute><DeviceEnrollment /></PrivateRoute>} key="devices" />,
  <Route path="/intents" element={<PrivateRoute><IntentTokens /></PrivateRoute>} key="intents" />,
  <Route path="/capsules" element={<PrivateRoute><CapsuleAccess /></PrivateRoute>} key="capsules" />,
  <Route path="/events" element={<PrivateRoute><SecurityEvents /></PrivateRoute>} key="events" />,
  <Route path="/admin" element={<PrivateRoute admin><AdminPanel /></PrivateRoute>} key="admin" />,
  <Route path="*" element={<Login />} key="default" />
];

export default routes;
