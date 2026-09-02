# Tracking ACC235 / proslean.com — guia de instalação

Todo o rastreamento do site vive em **um único arquivo**: [`/js/dl.js`](../js/dl.js).
Nenhuma outra tag de terceiro existe nas páginas. Esta pasta começa com `_`, então o
GitHub Pages não a publica.

## Funil medido

| # | Etapa | Evento no dataLayer | Onde |
|---|---|---|---|
| 1 | Chegou na primeira página | `view_landing` | `/` |
| 2 | Clicou no CTA da primeira página | `click_landing_cta` | `/` |
| 3 | Chegou na página de vídeo | `view_video` | `/video/` |
| 4 | Começou a assistir | `video_start` | `/video/` |
| 5 | Progresso do vídeo | `video_progress` (30/120/300/600/1200s) | `/video/` |
| 6 | **Viu a oferta** (conteúdo aparece abaixo do vídeo) | `offer_shown` + `view_item_list` | `/video/` |
| 7 | **Clicou no bottles** | `begin_checkout` | `/video/` |
| 8 | **Comprou** | `purchase` | servidor (postback BuyGoods) |

`offer_shown` traz `cta_reason` com o motivo da revelação: `timestamp` (assistiu até o
pitch), `returning` (visitante que já tinha visto), `atc_state` ou `url_param` (`?atc=1`).

Todo evento carrega `funnel: "RetinaClear"`, `lead_id: "RC_LEAD_02"` e `page_type`.

---

## Passo 1 — Google Tag Manager

1. Criar um container **Web** chamado `Youtube` → anotar o `GTM-XXXXXXX`.
2. Criar um container **Server** chamado `Youtube` → copiar o **Container Config**
   (a string longa que começa com `aWQ9`).
3. Importar `gtm-web-youtube.json` no container web e `gtm-server-youtube.json` no server.
4. Preencher as constantes na aba Variables de cada container:

| Constante | Onde | Valor |
|---|---|---|
| `GA4 Measurement ID` | web e server | `G-XXXXXXXXXX` |
| `Google Ads Conversion ID` | web e server | `AW-17677671261` |
| `Google Ads Label — begin_checkout` | web | label da ação de conversão |
| `Google Ads Label — purchase` | server | label da ação de conversão |
| `sGTM URL` | web | `https://gtm.proslean.com` |

## Passo 2 — Stape

1. Criar container, colar o **Container Config** do server do passo 1.
2. Ligar o power-up **Custom Loader**.
3. Adicionar o domínio `gtm.proslean.com`. O Stape devolve um registro **CNAME** para
   criar no DNS de `proslean.com`.
4. Copiar a URL do custom loader que o Stape gera.

## Passo 3 — apontar o site para o container

Editar **duas linhas** em [`/js/dl.js`](../js/dl.js) (linhas 11 e 12):

```js
var GTM_ID = "GTM-XXXXXXX"                    // ← seu ID
var GTM_SRC = "https://gtm.proslean.com/<caminho-do-loader>.js?id=" + GTM_ID
```

E trocar `GTM-XXXXXXX` nos 8 blocos `<!-- GTM:noscript -->` (um por página). O `noscript`
é só para quem navega sem JavaScript; se preferir, pode deixar para depois.

## Passo 4 — BuyGoods

No backoffice de afiliado: produto RetinaClear → **Settings** → **Postback pixels** →
**Add New**, com esta URL:

```
https://gtm.proslean.com/bg-postback?order_id={ORDERID}&product={PRODUCT_CODENAME}&commission={COMMISSION_AMOUNT}&subid={SUBID}&subid2={SUBID2}&subid3={SUBID3}&subid4={SUBID4}&type={CONV_TYPE}
```

O client `BuyGoods Postback` (arquivo `buygoods-postback-client.js`) responde `OK` em texto
puro. Isso é obrigatório: sem corpo na resposta, a BuyGoods considera falha e reenvia o
postback por até 3 dias, gerando conversões duplicadas.

### Como os identificadores viajam

No clique do botão, o `dl.js` monta o link do checkout assim:

```
https://buygoods.com/secure/checkout.html
  ?account_id=10751
  &product_codename=1_RC6_294
  &subid=gclid:<id>        → volta como {SUBID}   (identificador do clique no Google Ads)
  &subid2=<client_id>      → volta como {SUBID2}  (usuário no GA4)
  &subid3=<session_id>     → volta como {SUBID3}  (sessão no GA4)
  &subid4=<utms>           → volta como {SUBID4}  (origem da campanha)
```

Parâmetros vazios são omitidos. O `account_id` e o `product_codename` nunca são alterados.

O valor da compra não vem no postback, então o servidor deduz pelo `product_codename`:

| Codename | Valor |
|---|---|
| `1_RC1_069` | 69 USD |
| `1_RC3_177` | 177 USD |
| `1_RC6_294` | 294 USD |

## Passo 5 — GA4 e Google Ads

- GA4: marcar `purchase` e `begin_checkout` como eventos principais.
- Vincular a propriedade GA4 à conta do Google Ads.
- Importar `purchase` como conversão **primária** (contagem: uma por clique).
- Importar `begin_checkout` como **secundária**, para otimização em campanhas novas.

---

## Atenção: pixel da Meta vindo do player vTurb

O código do site está limpo, mas o player carrega `connect.facebook.net/fbevents.js`
sozinho. A chamada parte de `smartplayer.js`, ou seja, vem de um pixel configurado no
**painel da ConverteAI/vTurb**, não do nosso HTML. Confirmado no teste: `window.fbq`
existe na página mesmo sem nenhuma linha de Meta no repositório.

Para deixar só o nosso GTM, desative a integração de pixel dentro do painel do vTurb,
no player `6a978027d070d90d33d516cf` (seção de integrações/pixels). Não há como remover
isso pelo código do site.

---

## Verificação

1. Abrir `/` com `?gclid=TESTE&utm_source=youtube`. No console, `dataLayer` deve mostrar
   `view_landing` com `attribution.gclid`. O cookie `rc_attr` deve existir.
2. Clicar num CTA. O link deve carregar a query string para `/video/`.
3. Na página de vídeo, esperar o pitch (hoje 5 segundos, veja abaixo). O conteúdo aparece
   abaixo do vídeo e dispara `offer_shown` e `view_item_list`.
4. Passar o mouse num botão de compra. O link deve conter `subid`, `subid2`, `subid3` e `subid4`.
5. Clicar. Deve sair **exatamente um** `begin_checkout`, mesmo clicando na borda do card.
6. Testar o postback antes de vender:
   ```
   curl "https://gtm.proslean.com/bg-postback?order_id=TESTE1&product=1_RC3_177&subid2=<client_id>"
   ```
   Resposta esperada: `OK`. No GA4 DebugView deve aparecer `purchase` com `value=177`.
7. Fazer um pedido real de teste e conferir os logs do Stape.

### Onde mudar o tempo do pitch

[`video/index.html`](../video/index.html), no bloco de configuração:

```js
(window.buttonTiming = 5),        // desktop, em segundos
(window.buttonTimingMobile = 5),  // mobile, em segundos
```

Está em 5 segundos para teste. Para 47 minutos, use `2820`.

Para testar de novo do zero, limpe o `localStorage` do site. A página lembra quem já viu a
oferta e passa a mostrá-la de imediato.
