# Binho do Gás — Painel de Gestão

Interface web para o atendimento e a operação da distribuidora: pedidos,
entregadores, caixa por turno, métricas e configuração de preços. Consome a API
Spring Boot (`gas-delivery`) e reflete o fluxo de conversa do WhatsApp/Typebot.

> 📚 **Novo por aqui?** O **[APRENDENDO.md](../gas-delivery/APRENDENDO.md)** (no
> repositório do backend) explica React, TypeScript, Tailwind e as demais
> tecnologias, na ordem de estudo.

---

## 🛠️ Stack

| Tecnologia | Papel |
|---|---|
| [React 19](https://react.dev/) | Monta a interface por componentes |
| [Vite](https://vitejs.dev/) | Servidor de desenvolvimento e build |
| [TypeScript](https://www.typescriptlang.org/) | JavaScript com tipos |
| [Tailwind CSS v4](https://tailwindcss.com/) | Estilização por classes utilitárias |
| [@tanstack/react-query](https://tanstack.com/query) | Busca, cache e atualização automática |
| [Axios](https://axios-http.com/) | Chamadas HTTP (com o login) |
| [Lucide React](https://lucide.dev/) | Ícones vetoriais |
| [Recharts](https://recharts.org/) | Gráficos das métricas |

---

## 🏃 Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ para produção
```

Aponte para o backend em `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

> Também dá para trocar o endereço da API em tempo real pelo botão de
> **Configurações** no topo do painel.

### Login

O painel exige autenticação (HTTP Basic). Em desenvolvimento:

| Usuário | Senha |
|---|---|
| `admin` | `binho-admin` |

A troca é feita no `.env` do **backend** (`APP_ADMIN_USUARIO` /
`APP_ADMIN_SENHA`) — veja o `PRODUCAO.md`. O botão **Sair** fica no topo.

> Sem backend? O **Modo Simulação** permite navegar com dados falsos no
> navegador, sem servidor nenhum.

---

## 📋 Telas e funcionalidades

### 1. Painel de Pedidos (Kanban)
Quatro colunas: **Análise de CPF → Para Despachar → Na Rua → Finalizados**.

- **Pedido normal** chega como `PENDENTE`. O atendente clica em **Despachar**,
  escolhe um entregador ativo e o status vira `DESPACHADO`.
- **Gás do Povo** chega como `AGUARDANDO_VALIDACAO_CPF`, com o CPF em destaque e
  botão de copiar. **Aprovar CPF** → `PENDENTE`. **Reprovar** → `CPF_REPROVADO`.
- **Marcar Entregue** finaliza e soma ao caixa do entregador (se dinheiro/cartão).
- **Cancelar** disponível antes da entrega.

### 2. Tabela & Histórico
Listagem completa com filtros, busca e exportação.

### 3. Entregadores
Listagem com status ativo/inativo, cadastro, ativar/desativar e o **saldo que
cada um carrega** (`caixaAtual`). Entregadores inativos não aparecem no despacho.

### 4. Fechamento Caixa (turno)
- **Abrir caixa** no início do dia (não permite dois abertos).
- Resumo parcial do turno: dinheiro, cartão e PIX, por entregador.
- **Fechar caixa** congela o relatório no histórico e **zera o saldo** dos
  entregadores (prestação de contas).
- **Histórico** com os relatórios congelados de cada turno.
- Botão de **Imprimir**.

### 5. Métricas
Total de pedidos, faturamento, distribuição por forma de pagamento e
comparativo Normal × Gás do Povo.

### 6. Configurações (preços)
Edita os preços usados pelo robô **sem mexer no código**:
gás comum à vista, gás comum no crédito, Gás do Povo, desconto de quarta-feira
e liga/desliga da promoção.

### 7. Avisos no topo
- Faixa âmbar quando o **caixa está fechado** ("abra antes de atender").
- Faixa de aviso quando o **backend não responde**.

---

## 🎨 Design system

Todo o visual vive em **`src/index.css`** — cores, sombras, raios, tipografia e
as classes reutilizáveis (`.card`, `.btn-primary`, `.badge`, `.input`, `.tab`,
`.filter-btn`, `.kanban-col`, `.alert-warn`…).

Estética minimalista de SaaS (referências: Linear, Stripe, shadcn/ui):

- Fonte **Inter** · números com `tabular-nums`
- Fundo `#f8fafc` · cards brancos · bordas `1px solid #e2e8f0`
- Sombra única e discreta: `0 1px 2px rgba(0,0,0,.03)`
- **Sem** gradientes, sem `translateY` no hover, sem emojis como ícone
- Ícones Lucide com `stroke-width: 1.75`

**Para mudar o visual do sistema inteiro, edite esse arquivo.** Os componentes
consomem as classes dele.

---

## 📁 Onde está o quê

```
src/
├── App.tsx                     ← junta as telas, busca os dados, portão de login
├── index.css                   ← 🎨 design system
├── services/
│   ├── api.ts                  ← TODAS as chamadas ao backend
│   ├── auth.ts                 ← credenciais e logout
│   └── mockData.ts             ← dados do Modo Simulação
├── types/index.ts              ← formato dos dados (espelha o backend)
├── components/
│   ├── common/                 ← Navbar, PaymentBadge
│   ├── auth/LoginView.tsx      ← tela de login
│   ├── kanban/                 ← quadro de pedidos + card
│   ├── table/                  ← tabela e histórico
│   ├── entregadores/           ← gestão de motoboys
│   ├── caixa/                  ← turno de caixa
│   ├── config/                 ← preços
│   ├── metrics/                ← gráficos
│   └── modals/                 ← despachar, cadastrar, confirmar, API
└── utils/formatters.ts         ← moeda, telefone, CPF, data + configs de badge
```

**Regra:** chamada HTTP só em `services/api.ts`. Se um componente chamar axios
direto, fica difícil de manter.

---

## 🔌 API consumida

Todas as rotas `/api/**` exigem login. O contrato completo está em
`API-FRONTEND.md` (na pasta de documentos do projeto). Resumo:

| Área | Rotas |
|---|---|
| Pedidos | `GET /api/admin/pedidos` · `PUT .../aprovar-cpf` · `/reprovar-cpf` · `/despachar` · `/entregue` · `/cancelar` |
| Caixa | `GET /api/admin/caixa/atual` · `POST /abrir` · `POST /fechar` · `GET /historico` |
| Preços | `GET`/`PUT /api/admin/configuracao` |
| Entregadores | `GET`/`POST /api/entregadores` · `PUT /{id}/ativar` · `/desativar` |

---

## 🐛 Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Pede login em loop | Credencial errada | Confira o `.env` do backend |
| Lista vazia e sem erro | Backend fora do ar | `curl http://localhost:8080/actuator/health` |
| Erro de CORS no console | Origem não liberada | Adicione em `APP_CORS_ORIGINS` no backend |
| Dados não atualizam | Polling pausado | O painel atualiza pedidos a cada 5s em primeiro plano |
| Tela branca | Erro de JS | Abra o console do navegador (F12) |
