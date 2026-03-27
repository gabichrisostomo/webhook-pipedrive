const express = require('express');
const app = express();
app.use(express.json());

const EVOLUTION_URL = 'https://evolution-api-2lye.onrender.com';
const EVOLUTION_KEY = 'minha-chave-secreta-123';
const INSTANCE_NAME = 'minha-instancia';

function dentroDoHorario() {
  const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hora = agora.getHours();
  const diaSemana = agora.getDay(); // 0 = domingo, 6 = sábado

  const ehDiaSemana = diaSemana >= 1 && diaSemana <= 5;
  const ehHorarioComercial = hora >= 8 && hora < 18;

  return ehDiaSemana && ehHorarioComercial;
}

app.post('/webhook/lead', async (req, res) => {
  try {
    const lead = req.body.current;
    const nome = lead?.name || 'cliente';
    const telefone = lead?.phone?.[0]?.value?.replace(/\D/g, '');

    if (!telefone) return res.status(200).send('sem telefone');

    if (!dentroDoHorario()) {
      console.log('Fora do horário comercial, mensagem não enviada.');
      return res.status(200).send('fora do horario');
    }

    const mensagem = `Olá ${nome},\nObrigada pelo interesse na Valometry.\nSomos uma ferramenta de pesquisa especializada em mensuração de valor de marca. Trabalhamos com metodologia proprietária (BVS - Brand Value Score) para ajudar empresas a entender posicionamento competitivo, medir impacto de branding, definir arquitetura de marca ou estruturar tracking contínuo.\n\nPara eu entender melhor como podemos ajudar: qual o principal desafio de marca que vocês enfrentam hoje?\n\nSe fizer sentido, podemos agendar uma conversa para explorar juntos.\nAguardo seu retorno!\nAbraço,\nGabi`;

    await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY
      },
      body: JSON.stringify({
        number: `55${telefone}`,
        text: mensagem
      })
    });

    res.status(200).send('ok');
  } catch (err) {
    console.error(err);
    res.status(500).send('erro');
  }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
