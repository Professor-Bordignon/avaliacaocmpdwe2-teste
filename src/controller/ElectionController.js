const model = require('../models/ElectionModel');
const voteSchema = require('../validation/voteSchema');

// --- Tratamento de Erros (Simplificado para API/JSON) ---
// Retorna SEMPRE JSON para todas as rotas de API.
const errorHandler = (req, res, error, status = 500) => {
  console.error(
    `[STATUS ${status}] Erro na rota ${req.path}: ${error.message}`
  );

  // Sempre retorna JSON (para API ou para o browser que o chamou internamente)
  return res.status(status).json({
    error: error.message || 'Ocorreu um erro interno no servidor.',
  });
};

// 1. Página Inicial (Mantém EJS)
const getIndex = async (req, res) => {
  try {
    console.log('[getIndex controller]');
    const candidatos = await model.listCandidatesModel();
    res.status(200).render('index', {
      data: candidatos,
      errors: []
    });
  } catch (error) {
    // Para rotas de página, se houver um erro, o ideal é renderizar uma view de erro.
    // Usamos o padrão de retorno JSON do errorHandler para simplificar,
    // mas em produção, 'getIndex' deveria ter um tratamento de erro que renderize um template EJS de erro.
    errorHandler(req, res, error, 500);
  }
};

// Controller para obter o líder (CONSOLIDADO: Sempre retorna JSON)
// Esta função é agora usada pelo browser (que tratará o JSON) e pelos testes.
const getLeader = async (req, res) => {
  try {
    const leader = await model.getLeaderModel();
    if (!leader) {
      // Se não há líder, retorna 404 JSON
      return res.status(200).render('leader', {
        leader: null,
      });
    }
    // Sempre retorna JSON 200 OK
    res.status(200).render('leader', {
      leader: leader,
    });
  } catch (error) {
    errorHandler(req, res, error, 500);
  }
};

// Controller para registrar o voto (API pura - SEM CONDICIONAL)
const registerVote = async (req, res) => {
  console.log(req.body);
  try {
    const { error, value } = voteSchema.validate(req.body);
    if (error) {
      // Renderiza a view de resultado com status 400
      return res.status(400).render('result', {
        // ESSENCIAL: Passar o status 400
        status: 400,
        mensagem: `Erro de Validação: ${error.details[0].message}`,
        candidatoNome: null,
      });
    }

    const { email, id } = value;
    const result = await model.registerVoteModel(email, id);

    // Sempre retorna JSON 201 Created
    // res.status(201).json(result);
    res.status(201).render('result', {
      status: 201,
      mensagem: result.message,
      candidatoNome: result.candidato, // Usando o nome do candidato para exibição
    });
  } catch (error) {
    let status = 500;
    let customMessage = 'Ocorreu um erro inesperado no servidor.';

    if (error.message.includes('Voto duplicado')) {
      status = 403;
      customMessage = error.message;
    } else if (error.message.includes('Candidato não encontrado')) {
      status = 404;
      customMessage = error.message;
    } else {
      customMessage = error.message; // Para outros erros 500
    }

    // Em caso de erro, renderizamos a view de resultado com o status de erro
    res.status(status).render('result', {
      status: status, // Passa o status de erro (403, 404, 500)
      mensagem: customMessage,
      candidatoNome: null, // Não há candidato em caso de erro
    });
  }
};

module.exports = {
  getIndex,
  getLeader, // Rota única para API /eleicao/lider
  registerVote,
};
