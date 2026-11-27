// Conteúdo institucional embutido — Partido Missão por Altávia (PMA)
// República de Altávia — micronação lusófona soberana, enclave autônomo na
// região metropolitana de São Paulo, fundada em 17 de março de 2025.
//
// Este módulo garante que o site funcione em qualquer hospedagem, mesmo sem
// DATABASE_URL configurada (ex.: deploy na Vercel sem variáveis de ambiente).
// Quando o banco está disponível, os mesmos dados são lidos do Prisma.

export type SiteStat = {
  id: string
  key: string
  label: string
  value: number
  suffix: string | null
  order: number
}

export type SiteNewsPost = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  content: string
  author: string
  featured: boolean
  publishedAt: Date
}

export type SiteCandidacy = {
  id: string
  position: string
  election: string
  candidate: string
  slogan: string | null
  proposal: string | null
  status: string
  order: number
  createdAt: Date
}

// Estatísticas institucionais exibidas na página inicial
export const FALLBACK_STATS: SiteStat[] = [
  {
    id: 'stat-filiados',
    key: 'filiados',
    label: 'Filiados — o maior partido de Altávia',
    value: 3,
    suffix: '+',
    order: 1,
  },
  {
    id: 'stat-fundacao',
    key: 'fundacao',
    label: 'Fundação da República de Altávia',
    value: 2025,
    suffix: null,
    order: 2,
  },
  {
    id: 'stat-eixos',
    key: 'eixos',
    label: 'Eixos do programa Altávia 2027',
    value: 6,
    suffix: null,
    order: 3,
  },
]

// Notícias oficiais da Direção Nacional (conteúdo completo)
export const FALLBACK_NEWS: SiteNewsPost[] = [
  {
    id: 'news-programa-altavia-2027',
    slug: 'programa-altavia-2027',
    title: 'Missão por Altávia apresenta o programa Altávia 2027',
    category: 'Programa',
    summary:
      'O partido reúne em um único documento as suas propostas detalhadas de desenvolvimento econômico e de nacionalismo para a República de Altávia, com destaque para a escola virtual Sala Altávia.',
    content:
      'A Direção Nacional do Missão por Altávia apresenta o programa Altávia 2027, o documento que reúne as propostas detalhadas de desenvolvimento econômico e de nacionalismo do partido para a República de Altávia.\n\nO programa está organizado em seis eixos: Educação, Economia e livre mercado, Liberdades individuais e ética cristã, Cidadania digital, Nacionalismo e identidade nacional, e Desenvolvimento nacional. Cada eixo reúne propostas concretas para a vida nacional da micronação lusófona.\n\nO carro-chefe do documento é o eixo de Educação: o lançamento da plataforma Sala Altávia, uma escola virtual na qual os cidadãos terão atividades e aprenderão sobre todas as matérias — um projeto online aberto a toda a comunidade altaviana.\n\nOs demais eixos reafirmam os fundamentos da República defendidos pelo partido: a propriedade privada, o livre mercado, a ética cristã e a garantia das liberdades individuais, pilares da nação desde a sua fundação, em 17 de março de 2025.\n\nO programa completo está disponível para consulta nesta página, na seção Programa Altávia 2027, e as candidaturas do partido para as eleições nacionais serão divulgadas na aba Candidaturas.',
    author: 'Direção Nacional do PMA',
    featured: true,
    publishedAt: new Date('2026-11-27T09:00:00'),
  },
  {
    id: 'news-sala-altavia-escola-virtual',
    slug: 'sala-altavia-escola-virtual',
    title: 'Sala Altávia: a escola virtual para todos os cidadãos',
    category: 'Educação',
    summary:
      'Dentro do programa Altávia 2027, o partido lançará a plataforma online Sala Altávia, com atividades e conteúdo de todas as matérias para os cidadãos da República de Altávia.',
    content:
      'A aposta de educação do Missão por Altávia tem nome: Sala Altávia. A plataforma, prevista no programa Altávia 2027, será um projeto online no qual os cidadãos da República de Altávia terão acesso a atividades e aprenderão sobre todas as matérias.\n\nA Sala Altávia foi desenhada para funcionar como a escola virtual da micronação: um espaço único de aprendizado, aberto a toda a comunidade altaviana, em língua portuguesa.\n\nAo reunir atividades e conteúdos de todas as matérias, a plataforma permitirá que cada cidadão estude no seu próprio ritmo — da alfabetização à formação continuada.\n\nO partido entende a educação como a base do desenvolvimento econômico e do nacionalismo altaviano: um povo instruído constrói uma República mais forte. A Sala Altávia é o primeiro grande passo nessa direção dentro do programa Altávia 2027.',
    author: 'Direção Nacional do PMA',
    featured: false,
    publishedAt: new Date('2026-11-26T10:00:00'),
  },
  {
    id: 'news-maior-partido-de-altavia',
    slug: 'maior-partido-de-altavia',
    title: 'Missão por Altávia é o maior partido da República de Altávia',
    category: 'Institucional',
    summary:
      'Com mais de 3 filiados, o Missão por Altávia reúne a maior base de membros entre os partidos da micronação lusófona.',
    content:
      'O Missão por Altávia é hoje o maior partido da República de Altávia, reunindo mais de 3 filiados em todo o território nacional.\n\nO partido surgiu de um movimento político liderado por Nikolas, o Fundador, e cresceu ao apresentar propostas detalhadas de desenvolvimento econômico e de nacionalismo para a República — hoje sistematizadas no programa Altávia 2027.\n\nA filiação ao Missão por Altávia permanece aberta a todos os cidadãos altavianos. O cadastro pode ser feito diretamente nesta página, na seção Filie-se, e a Direção Nacional acompanha cada novo Filiado.',
    author: 'Direção Nacional do PMA',
    featured: false,
    publishedAt: new Date('2026-11-20T14:00:00'),
  },
  {
    id: 'news-republica-de-altavia-micronacao',
    slug: 'republica-de-altavia-micronacao',
    title: 'A República de Altávia: uma micronação lusófona soberana',
    category: 'Institucional',
    summary:
      'Fundada em 17 de março de 2025, a República de Altávia é um enclave autônomo na região metropolitana de São Paulo, pautado pela propriedade privada, pelo livre mercado, pela ética cristã e pelas liberdades individuais.',
    content:
      'A República de Altávia é uma micronação lusófona soberana e independente, estabelecida como um enclave autônomo na região metropolitana de São Paulo. A nação foi fundada em 17 de março de 2025.\n\nDesde a sua fundação, Altávia consolidou-se como um polo de organização política e social, pautada na defesa da propriedade privada, no livre mercado, na ética cristã e na garantia das liberdades individuais.\n\nÉ nessa República que atua o Missão por Altávia: surgido de um movimento político liderado por Nikolas, o Fundador, o partido reúne propostas detalhadas de desenvolvimento econômico e de nacionalismo — e é hoje o maior partido da micronação, com mais de 3 Filiados.',
    author: 'Direção Nacional do PMA',
    featured: false,
    publishedAt: new Date('2026-11-15T09:00:00'),
  },
]
