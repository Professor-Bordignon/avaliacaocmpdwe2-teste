const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db'); // Usar a conexão real do DB
const net = require('net');
const fs = require('fs');

const TEST_EMAIL = 'teste.supertest@votacao.com';

const NUMERO_MARIA_SILVA = 13;
const NUMERO_JOAO_SANTOS = 22;
let ID_MARIA_SILVA;
let ID_JOAO_SANTOS;

beforeEach(async () => {
  await db.query('DELETE FROM votantes WHERE email = ?', [TEST_EMAIL]);

  if (NUMERO_MARIA_SILVA && NUMERO_JOAO_SANTOS) {
    await db.query('DELETE FROM candidatos WHERE numero_candidato IN (?, ?)', [
      NUMERO_MARIA_SILVA,
      NUMERO_JOAO_SANTOS,
    ]);
  }

  const [mariaInsert] = await db.query(
    'INSERT INTO candidatos (nome_candidato, numero_candidato, votos) VALUES (?, ?, 0)',
    ['Maria Silva', 13]
  );
  ID_MARIA_SILVA = mariaInsert.insertId;

  const [joaoInsert] = await db.query(
    'INSERT INTO candidatos (nome_candidato, numero_candidato, votos) VALUES (?, ?, 0)',
    ['João Santos', 22]
  );
  ID_JOAO_SANTOS = joaoInsert.insertId;
});

afterAll(async () => {
  await db.query('DELETE FROM votantes WHERE email = ?', [TEST_EMAIL]);
  await db.query('DELETE FROM candidatos WHERE numero_candidato IN (?, ?)', [
    NUMERO_MARIA_SILVA,
    NUMERO_JOAO_SANTOS,
  ]);
  await db.end();
});

describe('Rotas de Eleição (Funcionalidades Principais)', () => {
  it('GET / deve listar os candidatos corretamente juntamento com o formulário de votação', async () => {
    await db.query(
      'UPDATE candidatos SET votos = 1 WHERE numero_candidato = ?',
      [ID_MARIA_SILVA]
    );
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /text\/html/); // **ALTERAÇÃO 1**
    expect(response.statusCode).toBe(200);
    expect(typeof response.text).toBe('string');
    expect(response.text).toContain('Maria Silva');
    // expect(response.text).toContain('1 Votos');
  });

  it('POST /eleicao/votar deve registrar um voto válido e retornar 201', async () => {
    await db.query('UPDATE candidatos SET votos = 0');
    await db.query('DELETE FROM votantes WHERE email = ?', [TEST_EMAIL]);

    const response = await request(app)
      .post('/votar')
      .send({ email: TEST_EMAIL, id: ID_MARIA_SILVA })
      .expect('Content-Type', /text\/html/); // **ALTERAÇÃO 1**

    expect(response.text).toContain('Voto Registrado!');
    expect(response.text).toContain('Maria Silva');
    expect(response.text).toContain('Você votou em:');

    const [candidato] = await db.query(
      'SELECT votos FROM candidatos WHERE id = ?',
      [ID_MARIA_SILVA]
    );
    expect(candidato[0].votos).toBe(1);

    const [votante] = await db.query(
      'SELECT email FROM votantes WHERE email = ?',
      [TEST_EMAIL]
    );
    expect(votante.length).toBe(1);
  });

  it('POST /votar deve retornar 403 para voto duplicado', async () => {
    await request(app)
      .post('/votar')
      .send({ email: TEST_EMAIL, id: ID_MARIA_SILVA });

    const response = await request(app)
      .post('/votar')
      .send({ email: TEST_EMAIL, id: ID_MARIA_SILVA });

    expect(response.statusCode).toBe(403);
    // expect(response.body).toHaveProperty(
    //   'error',
    //   'Voto duplicado. Este e-mail já foi registrado.'
    // );
  });

  it('POST /votar deve retornar 404 para candidato inexistente', async () => {
    const response = await request(app)
      .post('/votar')
      .send({ email: 'novo.votante@teste.com', id: 9999 });

    expect(response.statusCode).toBe(404);
    // expect(response.body).toHaveProperty('error', 'Candidato não encontrado.');
  });


  it('POST /votar deve retornar 400 para erro de validação', async () => {
    const response = await request(app)
      .post('/votar') 
      .send({ email: 'novo.votante@teste.com' }); // Enviado somente email sem id

    expect(response.statusCode).toBe(400);
    // expect(response.body).toHaveProperty('error', 'Candidato não encontrado.');
  });

  const Joi = require('joi');

  // Simula o schema de validação
  const voteSchema = Joi.object({
    email: Joi.string().email().required(),
    id: Joi.number().integer().required(),
  });

  //   // ✅ Verificações
  //   expect(res.status).toHaveBeenCalledWith(400);
  //   expect(res.render).toHaveBeenCalledWith(
  //     'result',
  //     expect.objectContaining({
  //       status: 400,
  //       mensagem: expect.stringContaining('Erro de Validação:'),
  //       candidatoNome: null,
  //     })
  //   );
  // });
});
