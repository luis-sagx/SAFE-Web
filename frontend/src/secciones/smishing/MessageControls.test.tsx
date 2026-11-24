import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ConsumptionAlert from './AlertaConsumo'
import SubscriptionCancellation from './BajaSuscripcion'
import GovernmentBenefit from './BonoEstado'
import TrafficCitation from './CitacionTransito'
import ForwardedCode from './CodigoReenviado'
import ScheduledDelivery from './EntregaProgramada'
import HeldPackage from './PaqueteRetenido'
import BlockedCard from './TarjetaBloqueada'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

it.each([
  ['Alerta de consumo', ConsumptionAlert, 'Bloqueaste una alerta de tu banco'],
  ['Baja suscripción', SubscriptionCancellation, 'Bloqueaste el número del cobro falso'],
  ['Bono del Estado', GovernmentBenefit, 'Bloqueaste el remitente del bono falso'],
  ['Citación de tránsito', TrafficCitation, 'Bloqueaste el remitente de la citación falsa'],
  ['Código reenviado', ForwardedCode, 'Bloqueaste al impostor'],
  ['Entrega programada', ScheduledDelivery, 'Bloqueaste el aviso de tu entrega'],
  ['Paquete retenido', HeldPackage, 'Bloqueaste el remitente del cobro falso'],
  ['Tarjeta bloqueada', BlockedCard, 'Bloqueaste el remitente que suplantó al banco'],
] as const)('%s conserva los controles y el bloqueo al abrir Mensajes desde el dock', (_name, Scenario, verdict) => {
  const phone = within(start(<Scenario />))
  fireEvent.click(phone.getByRole('button', { name: 'Mensajes' }))
  expect(phone.getByRole('button', { name: 'Volver a la lista de mensajes' })).toBeDefined()
  expect(screen.queryByText(verdict)).toBeNull()
  fireEvent.click(phone.getByRole('button', { name: 'Opciones del mensaje' }))
  expect(screen.queryByText(verdict)).toBeNull()
  expect(screen.queryByText(/Aquí no hay nada que hacer/)).toBeNull()

  fireEvent.click(phone.getByRole('button', { name: 'Bloquear número' }))
  expect(screen.getByText(verdict)).toBeDefined()
  expect(phone.queryByRole('button', { name: 'Opciones del mensaje' })).toBeNull()
})

it.each([
  ['Alerta de consumo', ConsumptionAlert, 'Prudente, pero incompleto'],
  ['Baja suscripción', SubscriptionCancellation, 'No contestaste, pero quedaste con la duda'],
  ['Bono del Estado', GovernmentBenefit, 'No caíste, pero te quedaste con la duda'],
  ['Citación de tránsito', TrafficCitation, 'No caíste, pero te quedaste con la duda'],
  ['Entrega programada', ScheduledDelivery, 'Lo dejaste pasar'],
  ['Paquete retenido', HeldPackage, 'Saliste sin verificar el envío'],
  ['Tarjeta bloqueada', BlockedCard, 'No caíste, pero te quedaste con la duda'],
] as const)('%s permite regresar desde el mensaje inicial', (_name, Scenario, verdict) => {
  const phone = within(start(<Scenario />))
  fireEvent.click(phone.getByRole('button', { name: /^Volver/ }))
  expect(screen.getByText(verdict)).toBeDefined()
})
