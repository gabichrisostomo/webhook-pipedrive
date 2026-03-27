const express = require('express');
const app = express();
app.use(express.json());

const EVOLUTION_URL = 'https://evolution-api-2lye.onrender.com';
const EVOLUTION_KEY = 'minha-chave-secreta-123';
const INSTANCE_NAME = 'minha-instancia';
const PIPEDRIVE_TOKEN = '4339411891ea2ea1d4370aca0ddadff93521ff67';
const STAGE_ID_LEAD = 217;

function dentroDoHorario() {
  const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hora = agora.getHours();
  const diaSemana = agora.getDay();
  return diaSemana >= 1 && diaSemana <= 5 && hora >= 8 && hora < 18;
}

async function getPersonPhone(personId) {
  const res = await fetch(`https://api.pipedrive.com/v1/persons/${personId}?api_token=${PIPEDRIVE_TOKEN}`);
  const data = await res.json();
  return data.data?.phone?.[0]?.value?.replace(/\D/g, '');
}

app.post('/webhook/lead', async (req, res) => {
  try {
    const deal = req.body.data;
    const stageId = deal?.stage_id;
    const personId = deal?.person_id;
    const nome = deal?.title || 'cliente';

    console.log(`stage_id: ${stageId}, person_id: ${personId}`);

    if (stageId !== STAGE_ID_LEAD) {
      console.log(`Estágio ignorado: ${stageId}`);
      return res.status(200).send('estagio ignorado');
    }

    if (!personId) return res.status(200).send('sem pessoa');
    if (!dentroDoHorario()) return res.status(200).send('fora do horario');

    const telefone = await getPersonPhone(personId);
    if (!telefone) return res.status(200).send('sem telefone');

    const numero = telefone.startsWith('55') ? telefone : `55${telefone}`;

    const mensagem = `Olá,\nObrigada pelo interesse na Valometry.\nSomos uma ferramenta de pesquisa especializada em mensuração de valor de marca. Trabalhamos com metodologia proprietária (BVS - Brand Value Score) para ajudar empresas a entender posicionamento competitivo, medir impacto de branding, definir arquitetura de marca ou estruturar tracking contínuo.\n\nPara eu entender melhor como podemos ajudar: qual o principal desafio de marca que vocês enfrentam hoje?\n\nSe fizer sentido, podemos agendar uma conversa para explorar juntos.\nAguardo seu retorno!\nAbraço,\nGabi`;

    await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY
      },
      body: JSON.stringify({ number: numero, text: mensagem })
    });

    console.log(`Mensagem enviada para ${numero}`);
    res.status(200).send('ok');
  } catch (err) {
    console.error(err);
    res.status(500).send('erro');
  }
});

module.exports = app;
