export type CurriculumAccent = "primary" | "secondary" | "tertiary";

export type CurriculumLesson = {
  id: string;
  title: string;
  prompt: string;
  story: string;
  explanation: string;
  answer: number;
  level: string;
  goal: string;
  tip: string;
  guidance: string[];
};

export type CurriculumTrack = {
  slug: string;
  name: string;
  short: string;
  estimatedTime: string;
  description: string;
  accent: CurriculumAccent;
  lessons: CurriculumLesson[];
};

export const curriculum: CurriculumTrack[] = [
  {
    slug: "addition",
    name: "Adição",
    short: "Somar valores positivos",
    estimatedTime: "5 min",
    description: "Comece com somas simples e avance para contas em duas etapas.",
    accent: "primary",
    lessons: [
      {
        id: "addition-1",
        title: "Somar dois números",
        prompt: "8 + 5 = ?",
        story: "Some os dois números mostrados na conta.",
        explanation: "Ao juntar 8 com 5, o total fica 13.",
        answer: 13,
        level: "Nível inicial",
        goal: "Meta: 3 acertos para avançar",
        tip: "Dica: junte os dois valores",
        guidance: ["Olhe para o sinal de mais.", "Junte o primeiro número com o segundo.", "Digite o total final."]
      },
      {
        id: "addition-2",
        title: "Adição em partes",
        prompt: "16 + 7 = ?",
        story: "Use uma conta em partes: 16 mais 4 vira 20, depois some 3.",
        explanation: "16 mais 7 pode ser pensado como 16 mais 4 mais 3, chegando a 23.",
        answer: 23,
        level: "Nível inicial",
        goal: "Meta: manter 70% de precisão",
        tip: "Dica: some primeiro as dezenas",
        guidance: ["Comece em 16.", "Chegue até 20 somando 4.", "Some os 3 que faltam para chegar em 23."]
      },
      {
        id: "addition-3",
        title: "Adição com dezenas",
        prompt: "24 + 18 = ?",
        story: "Some dezenas e unidades separadamente.",
        explanation: "24 mais 18 vira 20 mais 10 e 4 mais 8, totalizando 42.",
        answer: 42,
        level: "Nível intermediário",
        goal: "Meta: 2 acertos seguidos",
        tip: "Dica: organize por ordem",
        guidance: ["Separe dezenas e unidades.", "Some 20 com 10.", "Some 4 com 8 e junte os resultados."]
      }
    ]
  },
  {
    slug: "subtraction",
    name: "Subtração",
    short: "Retirar uma parte",
    estimatedTime: "6 min",
    description: "Aprenda a retirar quantidades com segurança e conferir o que sobra.",
    accent: "secondary",
    lessons: [
      {
        id: "subtraction-1",
        title: "Subtração direta",
        prompt: "14 - 6 = ?",
        story: "Retire 6 do número 14.",
        explanation: "Se você tira 6 de 14, sobram 8.",
        answer: 8,
        level: "Nível inicial",
        goal: "Meta: 3 acertos para avançar",
        tip: "Dica: pense no que sobra",
        guidance: ["Olhe para o sinal de menos.", "Comece em 14.", "Retire 6 e veja o número que sobra."]
      },
      {
        id: "subtraction-2",
        title: "Subtração em etapas",
        prompt: "21 - 9 = ?",
        story: "Você pode tirar 1 para chegar em 20 e depois tirar 8.",
        explanation: "21 menos 9 vira 20 menos 8, que resulta em 12.",
        answer: 12,
        level: "Nível inicial",
        goal: "Meta: manter 70% de precisão",
        tip: "Dica: volte casas aos poucos",
        guidance: ["Saia de 21.", "Tire 1 e chegue em 20.", "Tire os 8 restantes e chegue em 12."]
      },
      {
        id: "subtraction-3",
        title: "Subtração com dezenas",
        prompt: "35 - 17 = ?",
        story: "Retire 10 e depois retire 7.",
        explanation: "35 menos 10 resulta em 25. Depois 25 menos 7 resulta em 18.",
        answer: 18,
        level: "Nível intermediário",
        goal: "Meta: 2 acertos seguidos",
        tip: "Dica: separe dezenas e unidades",
        guidance: ["Comece em 35.", "Retire 10 para chegar em 25.", "Retire mais 7 e termine em 18."]
      }
    ]
  },
  {
    slug: "multiplication",
    name: "Multiplicação",
    short: "Grupos iguais",
    estimatedTime: "7 min",
    description: "Veja multiplicação como grupos repetidos para reduzir abstração.",
    accent: "tertiary",
    lessons: [
      {
        id: "multiplication-1",
        title: "Grupos iguais",
        prompt: "4 x 3 = ?",
        story: "Pense em 4 grupos com 3 elementos em cada grupo.",
        explanation: "Quatro grupos de 3 formam 12.",
        answer: 12,
        level: "Nível inicial",
        goal: "Meta: 3 acertos para avançar",
        tip: "Dica: repita a soma",
        guidance: ["Olhe para o sinal de multiplicação.", "Repita o número 3 quatro vezes.", "Some 3 + 3 + 3 + 3 para achar 12."]
      },
      {
        id: "multiplication-2",
        title: "Dobrar e agrupar",
        prompt: "6 x 4 = ?",
        story: "Você pode pensar em 6 mais 6 mais 6 mais 6.",
        explanation: "Quatro grupos de 6 produzem 24.",
        answer: 24,
        level: "Nível inicial",
        goal: "Meta: manter 70% de precisão",
        tip: "Dica: use dobrar quando ajudar",
        guidance: ["Repita o 6 quatro vezes.", "Some dois grupos primeiro.", "Junte os outros dois grupos e compare o total."]
      },
      {
        id: "multiplication-3",
        title: "Multiplicação intermediária",
        prompt: "7 x 5 = ?",
        story: "Cinco grupos de 7 formam 35.",
        explanation: "7 somado cinco vezes resulta em 35.",
        answer: 35,
        level: "Nível intermediário",
        goal: "Meta: 2 acertos seguidos",
        tip: "Dica: agrupe por 5 e complete o resto",
        guidance: ["Veja quantos grupos existem.", "Repita 7 cinco vezes.", "Some os grupos até chegar em 35."]
      }
    ]
  },
  {
    slug: "division",
    name: "Divisão",
    short: "Partes iguais",
    estimatedTime: "7 min",
    description: "Aprenda a dividir um total em partes iguais com linguagem literal.",
    accent: "secondary",
    lessons: [
      {
        id: "division-1",
        title: "Divisão direta",
        prompt: "18 / 3 = ?",
        story: "Divida 18 em 3 partes iguais.",
        explanation: "Se 18 é repartido em 3 grupos iguais, cada grupo fica com 6.",
        answer: 6,
        level: "Nível inicial",
        goal: "Meta: 3 acertos para avançar",
        tip: "Dica: pense em grupos iguais",
        guidance: ["Olhe para o sinal de divisão.", "Separe 18 em 3 grupos iguais.", "Veja quantos itens ficam em cada grupo."]
      },
      {
        id: "division-2",
        title: "Tabuada inversa",
        prompt: "20 / 4 = ?",
        story: "Qual número multiplicado por 4 dá 20?",
        explanation: "Como 4 vezes 5 é 20, 20 dividido por 4 é 5.",
        answer: 5,
        level: "Nível inicial",
        goal: "Meta: manter 70% de precisão",
        tip: "Dica: use tabuada inversa",
        guidance: ["Procure um número que repetido 4 vezes chegue em 20.", "Teste grupos iguais.", "Confirme que cada grupo fica com 5."]
      },
      {
        id: "division-3",
        title: "Divisão intermediária",
        prompt: "24 / 6 = ?",
        story: "Use a multiplicação inversa para confirmar.",
        explanation: "Como 6 vezes 4 é 24, o resultado da divisão é 4.",
        answer: 4,
        level: "Nível intermediário",
        goal: "Meta: 2 acertos seguidos",
        tip: "Dica: confira pela multiplicação",
        guidance: ["Pense na conta inversa.", "Pergunte qual número vezes 6 resulta em 24.", "Confirme que a resposta é 4."]
      }
    ]
  }
];

export const DEMO_USER = {
  name: "Aluno Demo",
  email: "aluno@basematematica.dev"
} as const;

export function getTrackMeta(slug: string) {
  return curriculum.find((track) => track.slug === slug);
}

export function getLessonMeta(lessonId: string) {
  for (const track of curriculum) {
    const lesson = track.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return { track, lesson };
    }
  }

  return null;
}
