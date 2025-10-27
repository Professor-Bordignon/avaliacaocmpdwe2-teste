const db = require('../db');

// Requisito: Listagem dos candidatos e votos
const listCandidatesModel = async () => {
  const query =
    'SELECT id, nome_candidato, numero_candidato, votos FROM candidatos ORDER BY votos DESC';
  const [rows] = await db.query(query);
  return rows;
};

// Requisito: Exibição do líder da eleição
const getLeaderModel = async () => {
  const query =
    'SELECT nome_candidato, votos FROM candidatos ORDER BY votos DESC LIMIT 1';
  const [rows] = await db.query(query);

  const leader = rows[0];
  if (!leader || leader.votos === 0) {
    return null;
  }

  return rows[0];
};

// Requisito: Votação (com transação e verificação de voto duplicado)
// Requisito: Votação (com transação e verificação de voto duplicado)
const registerVoteModel = async (email, id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [votantes] = await connection.query(
      'SELECT id FROM votantes WHERE email = ?',
      [email]
    );

    if (votantes.length > 0) {
      throw new Error('Voto duplicado. Este e-mail já foi registrado.');
    }

    await connection.query('INSERT INTO votantes (email) VALUES (?)', [email]);

    const [updateResult] = await connection.query(
      'UPDATE candidatos SET votos = votos + 1 WHERE id = ?',
      [id]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error('Candidato não encontrado.');
    }

    const [candidato] = await connection.query(
      'SELECT nome_candidato FROM candidatos WHERE id = ?',
      [id]
    );
    const nomeCandidato = candidato[0]?.nome_candidato;

    await connection.commit();

    return {
      message: `Voto registrado com sucesso! Você votou em ${nomeCandidato}.`,
      candidato: nomeCandidato,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  listCandidatesModel,
  getLeaderModel,
  registerVoteModel,
};
