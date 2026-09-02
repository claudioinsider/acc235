/* Client "BuyGoods Postback" para o container server do GTM (Stape).
 *
 * Recebe o Postback Pixel de afiliado da BuyGoods e transforma numa compra do GA4.
 * Como afiliados não temos acesso à página de obrigado da BuyGoods, este é o único
 * caminho possível para medir a venda.
 *
 * Cadastro no GTM server: Clients → New → Custom Template → colar este código no
 * editor de template, salvar, e criar um client usando o template.
 *
 * URL a cadastrar na BuyGoods (Produto → Settings → Postback pixels):
 *   https://gtm.proslean.com/bg-postback?order_id={ORDERID}&product={PRODUCT_CODENAME}
 *     &commission={COMMISSION_AMOUNT}&subid={SUBID}&subid2={SUBID2}&subid3={SUBID3}
 *     &subid4={SUBID4}&type={CONV_TYPE}
 *
 * IMPORTANTE: a resposta precisa ter corpo. Sem corpo, a BuyGoods trata como falha e
 * reenvia o postback por até 3 dias, o que duplicaria a conversão.
 *
 * Permissões necessárias no template:
 *   - read_request  (query parameters, path)
 *   - return_response
 *   - run_container
 *   - logging
 */

const claimRequest = require('claimRequest')
const extractEventsFromMpv2 = require('extractEventsFromMpv2')
const getRequestPath = require('getRequestPath')
const getRequestQueryParameters = require('getRequestQueryParameters')
const returnResponse = require('returnResponse')
const runContainer = require('runContainer')
const setResponseBody = require('setResponseBody')
const setResponseHeader = require('setResponseHeader')
const setResponseStatus = require('setResponseStatus')
const logToConsole = require('logToConsole')
const makeNumber = require('makeNumber')

const PATH = '/bg-postback'

/* Valor e nome do produto por codename. A BuyGoods manda apenas a comissão,
   não o valor da venda, então a tabela abaixo é a fonte de verdade. */
const CATALOG = {
  '1_RC1_069': { value: 69, name: 'RetinaClear - 1 Bottle', qty: 1 },
  '1_RC3_177': { value: 177, name: 'RetinaClear - 3 Bottles', qty: 3 },
  '1_RC6_294': { value: 294, name: 'RetinaClear - 6 Bottles', qty: 6 },
}

if (getRequestPath() !== PATH) {
  return
}

claimRequest()

const q = getRequestQueryParameters()
const orderId = q.order_id || ''
const codename = q.product || ''
const product = CATALOG[codename] || { value: 0, name: codename || 'unknown', qty: 1 }

/* subid carrega "gclid:xxx" / "gbraid:xxx" / "wbraid:xxx" */
const rawClick = q.subid || ''
let clickType = ''
let clickId = ''
const sep = rawClick.indexOf(':')
if (sep > 0) {
  clickType = rawClick.substring(0, sep)
  clickId = rawClick.substring(sep + 1)
}

const eventData = {
  event_name: 'purchase',
  client_id: q.subid2 || orderId,
  ga_session_id: q.subid3 || undefined,
  engagement_time_msec: 1,

  transaction_id: orderId,
  currency: 'USD',
  value: product.value,
  commission: makeNumber(q.commission || 0),
  affiliation: 'BuyGoods',
  conversion_type: q.type || 'sale',
  campaign_raw: q.subid4 || undefined,

  items: [
    {
      item_id: codename,
      item_name: product.name,
      price: product.value,
      quantity: product.qty,
      currency: 'USD',
    },
  ],
}

if (clickType === 'gclid') eventData.gclid = clickId
if (clickType === 'gbraid') eventData.gbraid = clickId
if (clickType === 'wbraid') eventData.wbraid = clickId

logToConsole('BuyGoods postback: order=' + orderId + ' product=' + codename + ' value=' + product.value)

runContainer(eventData, () => {
  setResponseStatus(200)
  setResponseHeader('content-type', 'text/plain')
  /* corpo obrigatório: sem ele a BuyGoods reenvia o postback por 3 dias */
  setResponseBody('OK')
  returnResponse()
})
