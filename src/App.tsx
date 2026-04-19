import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const CRM = lazy(() => import("./pages/CRM"));
const CampanhasOrigem = lazy(() => import("./pages/CampanhasOrigem"));
const Agenda = lazy(() => import("./pages/Agenda"));
const FollowUp = lazy(() => import("./pages/FollowUp"));
const RecuperacaoPacientes = lazy(() => import("./pages/RecuperacaoPacientes"));
const Assistant = lazy(() => import("./pages/Assistant"));
const AutomacaoInteligente = lazy(() => import("./pages/AutomacaoInteligente"));
const Patients = lazy(() => import("./pages/Patients"));
const PrePatients = lazy(() => import("./pages/PrePatients"));
const Convenios = lazy(() => import("./pages/Convenios"));
const DoctorsInsurance = lazy(() => import("./pages/DoctorsInsurance"));
const WhatsApp = lazy(() => import("./pages/WhatsApp"));
const Teleconsulta = lazy(() => import("./pages/Teleconsulta"));
const Connections = lazy(() => import("./pages/Connections"));
const Integration = lazy(() => import("./pages/Integration"));
const Users = lazy(() => import("./pages/Users"));
const DoctorSchedule = lazy(() => import("./pages/DoctorSchedule"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Register = lazy(() => import("./pages/Register"));
const ClinicInfo = lazy(() => import("./pages/ClinicInfo"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const RouteLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <p className="text-sm text-muted-foreground">Carregando modulo...</p>
  </div>
);

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/campanhas-origem" element={<CampanhasOrigem />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/follow-up" element={<FollowUp />} />
        <Route path="/recuperacao-pacientes" element={<RecuperacaoPacientes />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/automacao-inteligente" element={<AutomacaoInteligente />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/pre-patients" element={<PrePatients />} />
        <Route path="/convenios" element={<Convenios />} />
        <Route path="/doctors-insurance" element={<DoctorsInsurance />} />
        <Route path="/whatsapp" element={<WhatsApp />} />
        <Route path="/teleconsulta" element={<Teleconsulta />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/integration" element={<Integration />} />
        <Route path="/clinic-info" element={<ClinicInfo />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:doctorId/schedule" element={<DoctorSchedule />} />
        <Route path="/profile" element={<Profile />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
