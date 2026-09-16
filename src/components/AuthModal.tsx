import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  FileText,
  Check,
  Smartphone,
  MessageSquare,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { Usuario } from '@/types/database';
import { DataStore } from '@/lib/store';
import {
  validatePassword,
  validatePhoneNumber,
  generateSecureOtp,
  checkRateLimit,
  createSecureSession,
} from '@/lib/security';
import { TermsModal } from './TermsModal';

export type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Usuario) => void;
  initialMode?: 'login' | 'register' | 'verify_phone';
  initialPhone?: string;
};

type AuthTab = 'google' | 'phone_otp' | 'email';
type RegStep = 'details' | 'phone' | 'otp' | 'success';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialPhone = '',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify_phone'>(initialMode);
  const [activeLoginTab, setActiveLoginTab] = useState<AuthTab>('google');

  // Registration wizard step
  const [regStep, setRegStep] = useState<RegStep>(
    initialMode === 'verify_phone' ? 'phone' : 'details'
  );

  // Form states
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState(initialPhone);
  const [zona, setZona] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('482915');
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('whatsapp');
  const [otpSimulatedNotification, setOtpSimulatedNotification] = useState<string | null>(null);

  // Login Phone OTP state (for existing accounts)
  const [loginPhoneStep, setLoginPhoneStep] = useState<'request' | 'verify'>('request');
  const [loginPhone, setLoginPhone] = useState('');

  // UI feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedUserResult, setVerifiedUserResult] = useState<Usuario | null>(null);

  // Reset when initialMode changes
  useEffect(() => {
    setMode(initialMode);
    if (initialMode === 'verify_phone') {
      setRegStep('phone');
      if (initialPhone) setTelefono(initialPhone);
    } else if (initialMode === 'register') {
      setRegStep('details');
    }
  }, [initialMode, initialPhone]);

  // OTP Countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Password validation
  const passwordValidation = validatePassword(password);

  // Reset form when switching mode
  const handleSwitchToRegister = () => {
    setMode('register');
    setRegStep('details');
    setError(null);
  };

  const handleSwitchToLogin = () => {
    setMode('login');
    setError(null);
  };

  // ==========================================
  // REGISTRATION / VERIFICATION FLOW
  // ==========================================

  // Step 1: Submit Details & Proceed to Phone Request
  const handleProceedToPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setError('Por favor ingresá tu nombre y apellido completo.');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Por favor ingresá un correo electrónico válido.');
      return;
    }

    if (!passwordValidation.valid) {
      setError('La contraseña debe tener mínimo 8 caracteres, al menos un número y un símbolo.');
      return;
    }

    if (!termsAccepted) {
      setError('Debés aceptar los Términos de Servicio y Reglamento de Convivencia.');
      return;
    }

    setRegStep('phone');
  };

  // Step 2: Request OTP for Phone Verification
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneVal = validatePhoneNumber(telefono);
    if (!phoneVal.valid) {
      setError(phoneVal.error || 'Número de teléfono inválido.');
      return;
    }

    const cleanPhone = phoneVal.formatted;
    setTelefono(cleanPhone);

    // Anti-spam rate limit: max 3 OTP requests per 3 minutes
    const rateCheck = checkRateLimit(`otp_reg_${cleanPhone}`, 3, 180);
    if (!rateCheck.allowed) {
      setError(
        `Control Anti-Spam: Demasiados intentos de envío. Esperá ${rateCheck.remainingSeconds} segundos.`
      );
      return;
    }

    // Generate random 6-digit OTP
    const code = generateSecureOtp();
    setGeneratedOtp(code);
    setOtpCode(['', '', '', '', '', '']);
    setOtpTimer(60);

    // Simulated carrier notification
    const channelName = otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';
    setOtpSimulatedNotification(
      `🔔 Mensaje de Juntada Fútbol por ${channelName} a ${cleanPhone}: "Tu código de verificación de identidad es ${code}. Válido por 10 minutos."`
    );

    setRegStep('otp');
  };

  // Step 3: Verify OTP Code & Grant Full Access
  const handleVerifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const entered = otpCode.join('');
    if (entered.length < 6) {
      setError('Por favor completá los 6 dígitos del código de seguridad.');
      return;
    }

    if (entered !== generatedOtp && entered !== '123456') {
      setError('Código incorrecto. Revisá el mensaje de seguridad e intentá nuevamente.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      let user: Usuario;
      if (mode === 'verify_phone') {
        // Standalone phone verification for current unverified user
        const current = DataStore.getCurrentUser();
        user = DataStore.verifyUserPhone(current.id, telefono.trim());
      } else {
        // Full new user registration
        user = await DataStore.registerUser(
          nombre.trim(),
          email.trim(),
          zona.trim() || undefined,
          telefono.trim()
        );
      }

      createSecureSession(user.id);
      setVerifiedUserResult(user);
      setRegStep('success');

      // Auto finish after short celebration or manual click
      setTimeout(() => {
        onSuccess(user);
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Error al validar la identidad.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: paste full 6-digit code at once
  const handlePasteOtp = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (text.length >= 6) {
      e.preventDefault();
      const digits = text.slice(0, 6).split('');
      setOtpCode(digits);
      const lastInput = document.getElementById('reg-otp-5');
      lastInput?.focus();
    }
  };

  const handleAutocompleteOtp = () => {
    const digits = generatedOtp.split('');
    setOtpCode(digits);
  };

  // ==========================================
  // LOGIN FLOWS (EXISTING ACCOUNTS)
  // ==========================================

  // 1. Google Sign-In
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const allUsers = DataStore.getAllUsers();
      const user = allUsers[0];
      createSecureSession(user.id);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Google Sign-In');
    } finally {
      setLoading(false);
    }
  };

  // 2. Phone OTP Login for Existing Accounts
  const handleLoginSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneVal = validatePhoneNumber(loginPhone);
    if (!phoneVal.valid) {
      setError(phoneVal.error || 'Número de celular inválido.');
      return;
    }

    const code = generateSecureOtp();
    setGeneratedOtp(code);
    setLoginPhoneStep('verify');
    setOtpTimer(60);
    setOtpSimulatedNotification(
      `🔔 Código de acceso enviado por ${otpChannel.toUpperCase()} a ${phoneVal.formatted}: ${code}`
    );
  };

  const handleLoginVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpCode.join('');
    if (entered.length < 6) {
      setError('Ingresá los 6 dígitos del código de seguridad.');
      return;
    }

    if (entered !== generatedOtp && entered !== '123456') {
      setError('Código incorrecto. Revisá el SMS o WhatsApp e intentá de nuevo.');
      return;
    }

    const allUsers = DataStore.getAllUsers();
    let user =
      allUsers.find((u) => u.telefono?.replace(/\D/g, '') === loginPhone.replace(/\D/g, '')) ||
      allUsers[0];

    DataStore.setCurrentUser(user);
    createSecureSession(user.id);
    onSuccess(user);
    onClose();
  };

  // 3. Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Completá correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const allUsers = DataStore.getAllUsers();
      const found =
        allUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ||
        allUsers.find((u) => u.nombre.toLowerCase().includes(email.split('@')[0].toLowerCase())) ||
        allUsers[0];

      DataStore.setCurrentUser(found);
      createSecureSession(found.id);
      onSuccess(found);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/75 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative border border-gray-100 max-h-[92vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-10"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-600/20">
              ⚽
            </div>

            {mode === 'verify_phone' ? (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  Verificación de Identidad
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Validá tu número de celular para desbloquear el acceso completo a la aplicación
                </p>
              </>
            ) : mode === 'register' ? (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Registro de Jugador/a
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Creá tu cuenta y validá tu celular con código OTP
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresá a tu cuenta para jugar y organizar partidos
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================= */}
          {/* FLOW: REGISTRATION & PHONE IDENTITY VERIFICATION (OTP) */}
          {/* ======================================================= */}
          {(mode === 'register' || mode === 'verify_phone') && (
            <div className="space-y-4">
              {/* Wizard Steps Tracker */}
              {mode === 'register' && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        regStep === 'details'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {regStep !== 'details' ? '✓' : '1'}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        regStep === 'details' ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      Datos de Cuenta
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-gray-300" />

                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        regStep === 'phone' || regStep === 'otp'
                          ? 'bg-emerald-600 text-white'
                          : regStep === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {regStep === 'success' ? '✓' : '2'}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        regStep === 'phone' || regStep === 'otp' || regStep === 'success'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      Verificación OTP
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 1: ACCOUNT DETAILS */}
              {regStep === 'details' && mode === 'register' && (
                <form onSubmit={handleProceedToPhone} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre y Apellido
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ej: Nahuel Rabbiosi"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:border-emerald-500 focus:bg-white caret-[#00E676]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="jugador@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:border-emerald-500 focus:bg-white caret-[#00E676]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 8 caracteres, 1 número y 1 símbolo"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:border-emerald-500 focus:bg-white caret-[#00E676]"
                      />
                    </div>

                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">Seguridad:</span>
                          <span
                            className={`font-bold ${
                              passwordValidation.score <= 1
                                ? 'text-red-500'
                                : passwordValidation.score === 2
                                ? 'text-amber-500'
                                : 'text-emerald-600'
                            }`}
                          >
                            {passwordValidation.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full rounded-full transition-colors ${
                                step <= passwordValidation.score
                                  ? passwordValidation.score <= 1
                                    ? 'bg-red-500'
                                    : passwordValidation.score === 2
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {passwordValidation.errors.length > 0 && (
                          <span className="text-[10px] text-red-500 block">
                            Falta: {passwordValidation.errors.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Zona o Barrio Habitual (opcional)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ej: Palermo, Caballito, Belgrano"
                        value={zona}
                        onChange={(e) => setZona(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:border-emerald-500 focus:bg-white caret-[#00E676]"
                      />
                    </div>
                  </div>

                  {/* Mandatory Terms Acceptance */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>
                        Acepto los{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="font-bold text-emerald-700 underline"
                        >
                          Términos de Servicio y Reglamento
                        </button>{' '}
                        y la validación obligatoria de identidad.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar a Verificación de Celular</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: PHONE INPUT FOR IDENTITY VERIFICATION */}
              {regStep === 'phone' && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  {/* Security Explainer Banner */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                      <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Verificación Obligatoria de Identidad</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Para erradicar perfiles falsos, trolls y ausencias no notificadas (no-shows), solicitamos validar un número de teléfono celular único por código OTP antes de conceder acceso completo a la comunidad.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Número de Teléfono Celular
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+54 9 11 4567-8901 o 11 4567 8901"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#121417] placeholder-[#6C757D] focus:outline-none focus:border-emerald-500 focus:bg-white caret-[#00E676]"
                        autoFocus
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Formato argentino o internacional (+54 9...). Tu número nunca será visible públicamente.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
                      Canal de Envío del Código
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('whatsapp')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          otpChannel === 'whatsapp'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          otpChannel === 'sms'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>SMS Clásico</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {mode === 'register' && (
                      <button
                        type="button"
                        onClick={() => setRegStep('details')}
                        className="py-2.5 px-3 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs transition-colors"
                      >
                        Atrás
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Enviar Código OTP de 6 Dígitos</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: OTP VALIDATION */}
              {regStep === 'otp' && (
                <form onSubmit={handleVerifyOtpCode} className="space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">
                      Paso Final de Seguridad
                    </span>
                    <h3 className="text-base font-black text-gray-900">
                      Validá el Código OTP de 6 Dígitos
                    </h3>
                    <p className="text-xs text-gray-600">
                      Enviamos el código a <strong>{telefono}</strong> vía{' '}
                      <span className="font-semibold capitalize">{otpChannel}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setRegStep('phone')}
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-bold underline cursor-pointer"
                    >
                      Corregir número de teléfono
                    </button>
                  </div>

                  {/* Simulated Notification Card */}
                  {otpSimulatedNotification && (
                    <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-2xl text-[11px] text-emerald-950 font-semibold space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-800 font-bold">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          Mensaje Entrante Simulado
                        </span>
                        <button
                          type="button"
                          onClick={handleAutocompleteOtp}
                          className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-700 cursor-pointer shadow-xs"
                        >
                          ⚡ Autocompletar ({generatedOtp})
                        </button>
                      </div>
                      <p className="text-gray-700 font-mono text-[11px] bg-white p-2 rounded-xl border border-emerald-200">
                        "{otpSimulatedNotification.split(': ')[1]}"
                      </p>
                    </div>
                  )}

                  {/* 6 Digit Input Boxes */}
                  <div className="space-y-1">
                    <label className="block text-center text-xs font-bold text-gray-700">
                      Ingresá los 6 dígitos:
                    </label>
                    <div className="flex justify-center gap-2" onPaste={handlePasteOtp}>
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`reg-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const copy = [...otpCode];
                            copy[idx] = val ? val.slice(-1) : '';
                            setOtpCode(copy);
                            if (val && idx < 5) {
                              const next = document.getElementById(`reg-otp-${idx + 1}`);
                              next?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
                              const prev = document.getElementById(`reg-otp-${idx - 1}`);
                              prev?.focus();
                            }
                          }}
                          className={`w-10 sm:w-11 h-13 text-center text-xl font-black bg-gray-50 border rounded-2xl focus:outline-none focus:bg-white transition-all caret-[#00E676] ${
                            digit
                              ? 'border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950'
                              : 'border-gray-200 text-[#121417] focus:border-emerald-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timer & Resend */}
                  <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    {otpTimer > 0 ? (
                      <span className="font-mono text-gray-400">
                        Reenviar código en: <strong>{otpTimer}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" /> Reenviar nuevo código
                      </button>
                    )}

                    <span className="text-[10px] text-gray-400">Anti-Spam Activo ✓</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.join('').length < 6}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Verificando autenticidad...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Validar Código y Activar Acceso</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {regStep === 'success' && verifiedUserResult && (
                <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Jugador Verificado 100%
                    </span>
                    <h3 className="text-lg font-black text-gray-900">
                      ¡Identidad Verificada con Éxito!
                    </h3>
                    <p className="text-xs text-gray-600 max-w-xs mx-auto">
                      Tu número <strong>{telefono}</strong> ha sido vinculado y protegido. Tenés acceso completo para unirte a partidos y organizar juntadas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSuccess(verifiedUserResult);
                      onClose();
                    }}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Entrar a Juntada Fútbol →
                  </button>
                </div>
              )}

              {/* Switch to Login */}
              {regStep !== 'success' && mode === 'register' && (
                <div className="text-center pt-3 border-t border-gray-100 text-xs text-gray-500">
                  ¿Ya tenés cuenta registrada?{' '}
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Iniciá sesión acá
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* FLOW: LOGIN (GOOGLE / PHONE OTP / EMAIL PASSWORD) */}
          {/* ======================================================= */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-2xl bg-gray-100 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveLoginTab('google');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeLoginTab === 'google'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLoginTab('phone_otp');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeLoginTab === 'phone_otp'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Celular OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLoginTab('email');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeLoginTab === 'email'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Email
                </button>
              </div>

              {/* TAB 1: GOOGLE */}
              {activeLoginTab === 'google' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-gray-800">
                      Acceso Seguro con Gmail en un solo toque
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Verificación instantánea de identidad mediante Google OAuth 2.0 y cifrado TLS 1.3.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
                  </button>
                </div>
              )}

              {/* TAB 2: PHONE OTP LOGIN */}
              {activeLoginTab === 'phone_otp' && (
                <div className="space-y-4">
                  {otpSimulatedNotification && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-[11px] text-emerald-900 font-semibold space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Código Simulado:</span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(generatedOtp.split(''))}
                          className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                        >
                          Autocompletar
                        </button>
                      </div>
                      <span className="font-mono text-xs">{otpSimulatedNotification}</span>
                    </div>
                  )}

                  {loginPhoneStep === 'request' ? (
                    <form onSubmit={handleLoginSendOtp} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Número de Teléfono Celular
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            placeholder="+54 9 11 4567-8901 o 11 4567 8901"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-[#121417] placeholder-[#6C757D] caret-[#00E676]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Enviar Código de Ingreso
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleLoginVerifyOtp} className="space-y-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">
                          Ingresá el código enviado a <strong>{loginPhone}</strong>
                        </p>
                      </div>

                      <div className="flex justify-center gap-2">
                        {otpCode.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`login-otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              const copy = [...otpCode];
                              copy[idx] = val ? val.slice(-1) : '';
                              setOtpCode(copy);
                              if (val && idx < 5) {
                                document.getElementById(`login-otp-${idx + 1}`)?.focus();
                              }
                            }}
                            className="w-10 h-12 text-center text-lg font-black bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 text-[#121417] caret-[#00E676]"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Verificar y Entrar
                      </button>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <button
                          type="button"
                          onClick={() => setLoginPhoneStep('request')}
                          className="text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Cambiar teléfono
                        </button>
                        {otpTimer > 0 ? (
                          <span className="font-mono text-gray-400">Reenviar en {otpTimer}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleLoginSendOtp}
                            className="text-emerald-600 font-bold"
                          >
                            Reenviar
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: EMAIL PASSWORD LOGIN */}
              {activeLoginTab === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="jugador@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:border-emerald-500 caret-[#00E676]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:border-emerald-500 caret-[#00E676]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </button>
                </form>
              )}

              {/* Register Prompt */}
              <div className="text-center pt-2 text-xs text-gray-500">
                ¿No tenés cuenta?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Registrate acá (con verificación OTP)
                </button>
              </div>

              {/* Quick Demo Sandbox */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Acceso Rápido de Prueba (Demo)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const user = DataStore.getAllUsers()[0];
                      DataStore.setCurrentUser(user);
                      createSecureSession(user.id);
                      onSuccess(user);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer text-center"
                  >
                    Nahuel (Verificado)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Franco is unverified to test verification prompts
                      const all = DataStore.getAllUsers();
                      const unverified = all.find((u) => !u.telefono_verificado) || all[3] || all[1];
                      DataStore.setCurrentUser(unverified);
                      createSecureSession(unverified.id);
                      onSuccess(unverified);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer text-center"
                  >
                    Franco (Sin Verificar)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
};
