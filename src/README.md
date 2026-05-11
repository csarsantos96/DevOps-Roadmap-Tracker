# Cesar's Roadmap App — v4

PWA de planejamento pessoal — DevOps + Programação + Cloud + Idiomas — para a jornada **06/05/2026 → 20/12/2026**.

> Arquitetura modular orientada por **trilhas de conteúdo**, **agenda fixa**, e **certificações que puxam de múltiplas trilhas**.

---

## 🎯 Plano de Estudos — 7h/dia

```
🌅 MANHÃ   08:00 → 12:00 (4h)  Bloco principal de cada fase
☀️ TARDE   13:00 → 16:00 (3h)  Labs, projetos, exercícios
🇩🇪 NOITE   17:00 → 18:00       Alemão / Inglês
🇬🇧 NOITE   19:00 → 20:00       Inglês / Alemão revisão
```

### 📅 5 Fases até Dezembro/2026

| Fase | Período | Foco | Manhã | Tarde |
|------|---------|------|-------|-------|
| **⚡ Arrancada** | 06/05 → 31/05 | Linux Essential + Python+C base | Python + C | Linux + Pós FIAP |
| **🧱 Base Programador** | 01/06 → 31/07 | C+EDA, SQL, NoSQL, AWS+GCP | C, EDA, Python | SQL, AWS, GCP, SD |
| **☁️ Cloud + Java** | 01/08 → 30/09 | AWS SAA, GCP ACE, Java (Ebac) | Java, AWS | Docker, K8s, SD |
| **🐍 Java + Portfolio** | 01/10 → 30/11 | Spring Boot, K8s CKA, System Design | Java, K8s | SD, Go, Portfolio |
| **🎄 Go + SecureOps** | 01/12 → 20/12 | Go, projeto final, mock interviews | Go, Java | SecureOps, SD |

---

## 📚 17 Trilhas em 6 Grupos

### 🛠️ Infraestrutura & DevOps
- 🐧 **Linux Mastery** (120h) — Linux Essential da LinuxTips → RHCSA
- 🐳 **Docker & Containers** (60h) — alinhado ao PICK
- ⎈ **Kubernetes** (200h) — PICK → Kubestronaut
- 🌐 **Networking** (100h) — TCP/IP → CCNA

### ☁️ Cloud (paralelo desde o começo)
- ☁️ **AWS** (150h) — Treina Brasil → SAA → DOP
- 🌐 **GCP** (80h) — ACE → PCA

### 🏛️ Arquitetura & Dados
- 🔷 **System Design** (120h) — Alex Xu + ByteByteGo
- 🗄️ **SQL & Bancos Relacionais** (80h) — PostgreSQL, MySQL, Oracle
- 🍃 **NoSQL** (60h) — MongoDB, Redis, DynamoDB

### 🧮 Fundamentos CS
- 🧮 **Algoritmos** (80h) — Big-O → DP → Grafos
- ⛓️ **Estruturas de Dados em C** (80h) — Gus Caetano

### 💻 Linguagens (sequencial por fase)
- ⚙️ **C** (120h) — Gus Caetano + K&R · Fase 1-2
- 🐍 **Python** (120h) — automação, security, FastAPI · Fase 1-2
- ☕ **Java & Spring** (100h) — Ebac Backend · Fase 3-4
- 🦫 **Go** (80h) — Tour of Go → SecureOps CLI · Fase 4-5

### 🌍 Idiomas (fixos diariamente)
- 🇩🇪 **Alemão** (300h) — A2 → B1 → entrevista técnica
- 🇬🇧 **Inglês** (200h) — Reading técnico → Speaking → Interview

---

## 🎯 24 Certificações Mapeadas

### Top priority (com cursos que você já tem)
- 🔥 **CKA** — Certified Kubernetes Administrator (META PRINCIPAL)
- ☁️ **AWS SAA** — Solutions Architect Associate
- 🌐 **GCP ACE** — Google Associate Cloud Engineer
- 🎩 **RHCSA** — Red Hat Certified System Administrator
- 🐳 **DCA** — Docker Certified Associate
- 🍃 **MongoDB** — Associate Developer

### 🚀 Kubestronaut Path (5 certs CNCF)
KCNA → KCSA → CKAD → CKA → CKS

---

## 📁 Estrutura de Arquivos

```
roadmap-app/
├── index.html              ← shell limpo
├── manifest.json
├── sw.js                   ← service worker v4
├── icons/
└── src/
    ├── css/
    │   ├── tokens.css      ← design tokens
    │   ├── base.css
    │   └── components.css
    ├── js/
    │   ├── app.js          ← entry, hash router
    │   ├── store.js        ← localStorage v3 + import/export
    │   ├── schedule.js     ← motor da agenda
    │   ├── progress.js     ← cálculo cert/trilha
    │   ├── data.js
    │   ├── pomodoro.js     ← 50/10
    │   └── notifications.js
    ├── views/
    │   ├── home.js         ← "Hoje" contextual
    │   ├── track.js
    │   └── lists.js
    └── data/
        ├── tracks.json     ← manifest 17 trilhas
        ├── schedule.json   ← 5 fases + eventos fixos + blocos manhã/tarde
        ├── certs.json      ← 24 certs
        └── tracks/
            ├── linux.json          (7 módulos, 70 itens)
            ├── docker.json         (6 módulos, 58 itens)
            ├── kubernetes.json     (8 módulos, 68 itens)
            ├── redes.json          (5 módulos)
            ├── aws.json            (4 módulos, 42 itens)
            ├── gcp.json            (4 módulos)
            ├── system-design.json  (5 módulos, 54 itens)
            ├── sql.json            (5 módulos, 45 itens)
            ├── nosql.json          (4 módulos)
            ├── algoritmos.json     (4 módulos)
            ├── eda.json            (4 módulos)
            ├── c.json              (5 módulos, 55 itens)
            ├── python.json         (4 módulos)
            ├── java.json           (5 módulos, 46 itens — Ebac)
            ├── go.json             (4 módulos)
            ├── alemao.json         (3 módulos)
            └── ingles.json         (3 módulos)
```

**📊 Total:** 17 trilhas · 80 módulos · 515 tópicos · 161 exercícios · 24 certs · ~500h de conteúdo

---

## 🧠 Motor da Agenda (`schedule.js`)

A cada minuto o app calcula:

1. **Fase ativa** baseada na data atual (06/05 = Arrancada)
2. **Bloco atual** comparando o horário com weekday_template + fixed_events
3. **Trilha sugerida** considerando:
   - `morning_focus` da fase (08-12h) — em Fase 1: Python ou C
   - `afternoon_focus` (13-16h) — em Fase 1: Linux ou Pós FIAP
   - `weight_per_track` para escolher a de maior peso
4. **Próximo evento fixo** dos próximos 7 dias

### Eventos fixos (priority absoluta)
| Evento | Quando |
|--------|--------|
| 🇩🇪 Conv. Alemão | Ter+Qui 16:00–17:30 |
| 🇬🇧 Inglês ao vivo | Seg+Qua 18:00–18:40 |
| 🇩🇪 Aula Sábado | Sáb 12:00 |
| 💬 Daily Jefferson | Qui 06:00 (até Mar/2027) |
| 🏋️ Academia | Seg–Sáb 06:30 |

---

## ✨ Como expandir

### Adicionar módulo a uma trilha
Edite `src/data/tracks/{trilha}.json`, adicione em `modules[]`. Não precisa tocar em código.

### Adicionar uma certificação
Edite `src/data/certs.json`, em `certs[]`, referenciando módulos por ID:
```json
{
  "id": "minha-cert",
  "requires_modules": ["docker.1", "k8s.5", "linux.3"],
  "target_phase": "fase4"
}
```

### Trocar template da semana
Edite `src/data/schedule.json` → `weekday_template`. Cada bloco aceita:
- `track_id`: trilha fixa (ex: `"alemao"`)
- `track_hint`: `morning_primary` | `afternoon_primary` | `afternoon_secondary` | `review` | `lab` | `rest`

---

## 🚀 Deploy

```bash
# local
python3 -m http.server 8080

# Vercel (já configurado em dev-ops-roadmap-tracker.vercel.app)
git push
```

Funciona offline após primeira visita (PWA).

---

## 🔧 Console API

```js
App.exportData()  // baixa backup JSON
App.importData()  // abre file picker
App.reset()       // apaga tudo (com confirmação)
```

---

**Versão:** 4.0
**Data de partida:** 06/05/2026 — Quarta-feira
**Deadline final:** 20/12/2026
**Mantido por:** Cesar Santos · Fronteiras-PI 🇧🇷
