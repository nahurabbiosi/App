import React from 'react';
import { X, ShieldCheck, Scale, AlertTriangle, FileText, Lock } from 'lucide-react';

export type TermsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                Términos de Servicio y Reglamento
              </h2>
              <span className="text-[11px] text-emerald-700 font-bold block">
                Fecha de vigencia: 16 de septiembre de 2026
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Text Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-700 leading-relaxed font-normal">
          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              Registro, Autenticación y Verificación de Cuenta
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong>Requisitos de Edad:</strong> El usuario declara tener al menos 13 años de edad para utilizar la aplicación. En caso de menores de 18 años, el uso de la plataforma se realiza bajo supervisión y autorización de sus padres o tutores legales.
              </li>
              <li>
                <strong>Métodos de Autenticación:</strong> El acceso a la plataforma se realiza mediante autenticación segura vía Google Sign-In (OAuth 2.0), verificación de número telefónico por código de un solo uso (OTP via SMS/WhatsApp) o correo electrónico verificado con contraseña robusta.
              </li>
              <li>
                <strong>Unicidad de Cuenta:</strong> Cada cuenta debe estar vinculada obligatoriamente a un número telefónico activo y real. Se prohíbe estrictamente la creación de múltiples cuentas por parte de un mismo usuario. La detección de cuentas duplicadas o falsas derivará en el bloqueo inmediato de todos los perfiles asociados.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              Sistema de Cobros, Costos y Transparencia Financiera
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong>Aclaración Financiera:</strong> Juntada Fútbol no es una pasarela de pagos, no retiene dinero, no cobra comisiones ni actúa como intermediario financiero.
              </li>
              <li>
                <strong>Cálculo de Costo por Jugador:</strong> La app proporciona una herramienta algorítmica de cálculo automático:
                <div className="my-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-800">
                  Costo por Jugador = Costo Total del Alquiler de la Cancha / Cantidad de Cupos
                </div>
              </li>
              <li>
                <strong>Obligación de Pago:</strong> Todo jugador que permanezca inscripto en un partido al momento del Cierre de Lista (2 horas antes del inicio) asume el compromiso de abonar su cuota correspondiente (vía transferencia directa al organizador o en efectivo en el predio), incluso si no asiste al partido, salvo que haya conseguido un reemplazante válido a través de la app.
              </li>
              <li>
                <strong>Transparencia en Adicionales:</strong> Si el organizador agrega costos extras (ej. alquiler de pelota, pecheras, luz nocturna), estos deben estar desglosados explícitamente en la ficha del partido antes de que los jugadores se unan.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              Sistema de Cancelaciones, Penalizaciones y Suspensión de Cuenta
            </h3>
            <p className="text-gray-600">
              Para proteger a la comunidad de inasistencias de último momento y faltas de pago, se aplican las siguientes reglas y plazos exactos:
            </p>

            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1.5 text-amber-950">
              <span className="font-bold block">A. Políticas de Cancelación (Bajas):</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li><strong>Baja Anticipada (Más de 4 horas antes):</strong> Sin penalización. El cupo se libera automáticamente a la lista de espera.</li>
                <li><strong>Baja Tardía (Entre 4 y 2 horas antes):</strong> Aplica una reducción del 5% en el Índice de Asistencia del perfil.</li>
                <li><strong>Baja Crítica (A menos de 2 horas del partido):</strong> Se considera equivalente a inasistencia ("Plantón"). Aplica reducción del 15% en el Índice de Asistencia y sanción temporal.</li>
              </ul>
            </div>

            <div className="bg-red-50/70 border border-red-200 p-3 rounded-xl space-y-1.5 text-red-950">
              <span className="font-bold block">B. Escala de Sanciones por Inasistencia / No Pago:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li><strong>1° Infracción:</strong> Aviso de advertencia en la app y suspensión de la cuenta para unirse a nuevos partidos por 7 días.</li>
                <li><strong>2° Infracción:</strong> Suspensión de la cuenta por 30 días y colocación de la insignia de advertencia en el perfil ("Baja Confiabilidad").</li>
                <li><strong>3° Infracción:</strong> Inhabilitación / Baneo permanente de la cuenta y del número de teléfono asociado.</li>
              </ul>
            </div>

            <p className="text-gray-600">
              <strong>C. Índice de Asistencia Ponderado:</strong> El perfil exhibe el porcentaje calculado sobre los últimos 20 partidos. Si el índice cae por debajo del 80%, el sistema restringe al usuario a un máximo de 1 partido activo en simultáneo.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                4
              </span>
              Exención de Responsabilidad Civil, Lesiones y Predios
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong>Aptitud Física:</strong> El usuario declara bajo su propia responsabilidad estar médicamente apto para la práctica de ejercicios de alta intensidad.
              </li>
              <li>
                <strong>Deslinde de Responsabilidad:</strong> Juntada Fútbol queda eximida de toda responsabilidad legal, civil, penal o administrativa ante:
                <ul className="list-circle pl-4 space-y-1 mt-1">
                  <li>Lesiones corporales, esguinces, fracturas o emergencias médicas ocurridas durante los encuentros.</li>
                  <li>Robos, hurtos, extravíos o daños a pertenencias personales en las instalaciones de los complejos o sus inmediaciones.</li>
                  <li>Conflictos o disputas físicas/verbales entre usuarios.</li>
                  <li>Cancelaciones imprevistas o deficiencias en las instalaciones por parte de los complejos deportivos.</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                5
              </span>
              Ciberseguridad, Privacidad y Protección de Datos Personales
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong>Cifrado y Seguridad:</strong> Todas las comunicaciones entre la app y servidores utilizan cifrado de grado bancario TLS 1.3 (HTTPS). Las contraseñas se almacenan procesadas mediante algoritmos seguros (BCrypt / Argon2).
              </li>
              <li>
                <strong>Protección Anti-Scraping:</strong> Implementación de límites de tasa de peticiones (Rate Limiting) para prevenir ataques de fuerza bruta, spam o cosecha automatizada de perfiles.
              </li>
              <li>
                <strong>Privacidad de Contactos:</strong> La app nunca muestra el correo electrónico ni el número de teléfono del usuario de forma pública en la interfaz ni en los chats. La interacción se gestiona exclusivamente a través de IDs anónimos y nombres de usuario.
              </li>
              <li>
                <strong>Derecho de Supresión (Eliminación de Cuenta):</strong> El usuario tiene derecho a solicitar en cualquier momento la eliminación definitiva de su cuenta y todos sus datos personales asociados mediante el botón "Eliminar mi cuenta" en la sección de configuración.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                6
              </span>
              Reglas de Modulación, Reportes y Moderación
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong>Mecanismo de Denuncia:</strong> En cada chat y perfil existe un botón de "Reportar Usuario" con las siguientes categorías específicas:
                <ul className="list-circle pl-4 space-y-0.5 mt-1 font-semibold text-gray-700">
                  <li>• Inasistencia / No pagó su parte.</li>
                  <li>• Conducta violenta, antideportiva o juego sucio.</li>
                  <li>• Acoso, discriminación o lenguaje ofensivo.</li>
                  <li>• Perfil falso o spam.</li>
                </ul>
              </li>
              <li>
                <strong>Resolución de Disputas:</strong> El equipo de soporte de Juntada Fútbol revisará los reportes dentro de un plazo máximo de 24 a 48 horas hábiles para tomar medidas disciplinarias (advertencias, suspensión de chat o bloqueo definitivo).
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Comunidad Segura con Cifrado TLS 1.3</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Entendido y Acepto
          </button>
        </div>
      </div>
    </div>
  );
};
