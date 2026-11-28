// Teste de integração da camada Firebase Realtime Database — PMA.
//
// Roda SEM DATABASE_URL para exercitar o mesmo caminho usado no deploy da
// Vercel: todas as leituras e escritas devem ir para o Realtime Database
// (projeto texnk-87824) e persistir. O conteúdo institucional embutido é
// sincronizado na primeira leitura (marcador pma/meta/seeded).
//
// Uso: bun scripts/test-firebase-mode.ts

// Força o modo sem Prisma (mesma condição do deploy na Vercel).
delete process.env.DATABASE_URL

import {
  getStats,
  listNews,
  getNewsBySlug,
  listCandidacies,
  createContactMessage,
  createMember,
  listAdminNews,
  createNews,
  updateNews,
  deleteNews,
  createCandidacy,
  updateCandidacy,
  deleteCandidacy,
  listMembers,
  listContactMessages,
  setContactMessageRead,
  deleteContactMessage,
  getOverview,
} from '../src/lib/data'
import { rtdbGet, rtdbDelete } from '../src/lib/firebase-rtdb'

const TEST_EMAIL = 'teste-pma-integracao@exemplo.altavia'

function ok(label: string, cond: boolean) {
  if (cond) {
    console.log('  OK   —', label)
  } else {
    console.log('  FALHA —', label)
    process.exitCode = 1
  }
}

async function main() {
  console.log('== Estatísticas ==')
  const stats = await getStats()
  ok(`getStats retornou ${stats.length} estatísticas`, stats.length >= 3)

  console.log('== Notícias ==')
  const news = await listNews()
  ok(`listNews retornou ${news.length} notícias publicadas`, news.length >= 4)
  const post = await getNewsBySlug('programa-altavia-2027')
  ok('getNewsBySlug(programa-altavia-2027) encontrou a notícia', post !== null)

  const draft = await createNews({
    title: 'Notícia de teste — integração Firebase',
    category: 'Institucional',
    summary: 'Sumário da notícia de teste.',
    content: 'Conteúdo da notícia de teste.',
    author: 'Teste automático',
    featured: false,
    published: false,
  })
  ok('createNews criou o rascunho', draft.ok === true)
  const draftId = draft.ok ? draft.post.id : ''

  const adminList = await listAdminNews()
  ok('listAdminNews inclui o rascunho', adminList.some((p) => p.id === draftId))
  const publicList = await listNews()
  ok('listNews NÃO mostra o rascunho não publicado',
    publicList.every((p) => p.id !== draftId))

  const dup = await createNews({
    title: 'Notícia de teste — integração Firebase',
    category: 'Institucional',
    summary: 'Sumário.',
    content: 'Conteúdo.',
    author: 'Teste automático',
    featured: false,
    published: false,
  })
  ok('createNews rejeitou slug duplicado', dup.ok === false)

  const updated = await updateNews(draftId, {
    title: 'Notícia de teste — integrada e editada',
    published: true,
  })
  ok('updateNews editou a notícia', updated?.title === 'Notícia de teste — integrada e editada')
  const publishedList = await listNews()
  ok('listNews mostra a notícia após publicar',
    publishedList.some((p) => p.id === draftId))

  ok('deleteNews removeu a notícia de teste', (await deleteNews(draftId)) === true)

  console.log('== Candidaturas ==')
  const candidaciesBefore = await listCandidacies()
  const candidacy = await createCandidacy({
    position: 'Cargo de Teste',
    election: 'Pleito de Teste 2027',
    candidate: 'Candidato de Teste',
    slogan: null,
    proposal: null,
    status: 'Anunciada',
  })
  ok('createCandidacy registrou a candidatura', !!candidacy.id)
  const updatedCandidacy = await updateCandidacy(candidacy.id, {
    ...candidacy,
    status: 'Registrada',
  })
  ok('updateCandidacy atualizou a situação', updatedCandidacy?.status === 'Registrada')
  ok('deleteCandidacy removeu a candidatura de teste',
    (await deleteCandidacy(candidacy.id)) === true)
  const candidaciesAfter = await listCandidacies()
  ok('lista de candidaturas voltou ao estado inicial',
    candidaciesAfter.length === candidaciesBefore.length)

  console.log('== Filiados ==')
  const member = await createMember({
    fullName: 'Filiado de Teste',
    email: TEST_EMAIL,
    phone: null,
    city: 'São Paulo',
    region: 'RMSP',
    birthYear: null,
    motivation: null,
  })
  ok('createMember registrou o filiado de teste', member.ok === true)
  const memberDup = await createMember({
    fullName: 'Filiado de Teste',
    email: TEST_EMAIL,
    phone: null,
    city: 'São Paulo',
    region: 'RMSP',
    birthYear: null,
    motivation: null,
  })
  ok('createMember rejeitou e-mail duplicado', memberDup.ok === false)
  const members = await listMembers()
  ok('listMembers listou o filiado de teste',
    members.some((m) => m.email === TEST_EMAIL))

  console.log('== Mensagens ==')
  await createContactMessage({
    name: 'Contato de Teste',
    email: TEST_EMAIL,
    subject: 'Teste de integração',
    message: 'Mensagem automática de teste da camada Firebase.',
  })
  const messages = await listContactMessages()
  const testMessage = messages.find((m) => m.email === TEST_EMAIL)
  ok('createContactMessage + listContactMessages funcionaram', !!testMessage)
  if (testMessage) {
    const read = await setContactMessageRead(testMessage.id, true)
    ok('setContactMessageRead marcou como lida', read?.read === true)
    ok('deleteContactMessage removeu a mensagem de teste',
      (await deleteContactMessage(testMessage.id)) === true)
  }

  console.log('== Painel ==')
  const overview = await getOverview()
  ok('getOverview: banco conectado (Firebase)', overview.dbConnected === true)
  console.log('  overview =', JSON.stringify(overview))

  // Limpeza final: remove o filiado de teste do Realtime Database.
  const membersMap = await rtdbGet<Record<string, { email: string }>>('pma/members')
  for (const [id, value] of Object.entries(membersMap ?? {})) {
    if (value.email === TEST_EMAIL) {
      await rtdbDelete(`pma/members/${id}`)
      console.log('  OK   — filiado de teste removido do banco (limpeza)')
    }
  }
  const membersAfter = await listMembers()
  ok('nenhum dado de teste permaneceu em filiados',
    membersAfter.every((m) => m.email !== TEST_EMAIL))

  console.log('\n== Persistência (releitura direta do Realtime Database) ==')
  const seeded = await rtdbGet<boolean>('pma/meta/seeded')
  ok('marcador pma/meta/seeded gravado', seeded === true)
  const newsMap = await rtdbGet<Record<string, { slug: string }>>('pma/newsPosts')
  ok('notícias persistidas no banco', Object.keys(newsMap ?? {}).length >= 4)
  console.log('  notícias no banco:', Object.keys(newsMap ?? {}).length)
}

main().catch((error) => {
  console.error('ERRO no teste:', error)
  process.exit(1)
})
