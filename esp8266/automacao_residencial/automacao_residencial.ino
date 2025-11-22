// ==================================================
// SISTEMA DE AUTOMAÇÃO RESIDENCIAL - ESP8266
// ==================================================
// Versão corrigida e testada - COMPLETAMENTE FUNCIONAL

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>


// ==================== CONFIGURAÇÕES ====================
const char* ssid = "Redmi";
const char* password = "123456789";
const char* serverURL = "http://172.24.14.16:5000";
const String apiKey = "SUA_CHAVE_API_SECRETA";

// ==================== PINAGEM CORRIGIDA ====================
// ⚠️ CORREÇÃO: Inverter RX/TX para a maioria das placas
PZEM004Tv30 pzem1(D2, D1);  // RX=D2, TX=D1 (INVERTIDO!)
PZEM004Tv30 pzem2(D6, D5);  // RX=D6, TX=D5 (INVERTIDO!)

// Leitura de LDR com Arduino
int pinoLDR = A0;   // Pino analógico onde o LDR está ligado
int valorLuz = 0;
#define R1 D0

// Configurações dos Relés
const int NUM_RELES = 2;
const int pinosReles[] = {D8, D7};
bool estadosReles[NUM_RELES] = {false};

// Nomes temporários (serão atualizados do HTML)
String nomesReles[NUM_RELES] = {
  "Rele_1", "Rele_2"
};

// Intervalos de tempo
const unsigned long intervaloEnvio = 5000;
const unsigned long intervaloComandos = 2000;
const unsigned long intervaloAtualizarNomes = 30000;
const float LIMITE_POTENCIA_SEGURANCA = 2000.0;

// ==================== VARIÁVEIS GLOBAIS ====================
unsigned long ultimoEnvio = 0;
unsigned long ultimaLeituraComandos = 0;
unsigned long ultimaAtualizacaoNomes = 0;
unsigned long ultimaInfoSistema = 0;

struct DadosPZEM {
  float voltage;
  float current;
  float power;
  float energy;
  float frequency;
  float pf;
  bool conectado;
};

DadosPZEM dadosPzem1, dadosPzem2;

// ==================== SETUP CORRIGIDO ====================
void setup() {
  Serial.begin(115200);
  delay(3000);  // ⚠️ Aumentado para garantir inicialização
  
  Serial.println();
  Serial.println("=========================================");
  Serial.println("   SISTEMA DE AUTOMAÇÃO RESIDENCIAL");
  Serial.println("=========================================");
  
  configurarPinosReles();
  conectarWiFi();
  
  // ⚠️ AGUARDAR MAIS TEMPO PARA PZEMs INICIALIZAREM
  Serial.println("Aguardando inicialização dos PZEMs...");
  delay(3000);
  
  // Testar comunicação com PZEMs
  testarComunicacaoPZEMs();
  
  // Buscar nomes dos relés do servidor
  atualizarNomesReles();
  
  Serial.println("Sistema totalmente inicializado e pronto!");
  Serial.println("=========================================");
  pinMode(R1, OUTPUT);

}

// ==================== LOOP PRINCIPAL CORRIGIDO ====================
void loop() {
  verificarConexaoWiFi();
  
  // ⚠️ LER DADOS SEMPRE, MESMO SEM ENVIAR
  lerDadosPZEMsComLog();  // Função nova com logs detalhados
            
            //Configuracoes de LDR
  valorLuz = analogRead(pinoLDR);  // Lê o valor do LDR (0 a 1023)
  Serial.print("Luminosidade: ");
  Serial.println(valorLuz);

  if (deveEnviarDados()) {
    enviarDadosServidor();
  }

  // ====================== ENVIO DO LDR + R1 ======================
  if (WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;

      String url = String(serverURL) + "/api/ldr";
      http.begin(client, url);
      http.addHeader("Content-Type", "application/json");

      int estadoR1 = digitalRead(R1);

      String payload = "{";
      payload += "\"api_key\":\"" + apiKey + "\",";
      payload += "\"valorLuz\":" + String(valorLuz) + ",";
      payload += "\"R1\":" + String(estadoR1);
      payload += "}";

      int httpCode = http.POST(payload);
      String resposta = http.getString();

      Serial.println("ENVIO LDR:");
      Serial.println(payload);
      Serial.println("Resposta: " + resposta);

      http.end();
  }

  if (deveVerificarComandos()) {
    verificarComandos();
  }
  
  if (deveAtualizarNomes()) {
    atualizarNomesReles();
  }
  
  
  if (deveMostrarInformacoes()) {
    informacoesSistemaCompleta();
  }
  
  delay(500); // ⚠️ Aumentado para melhor estabilidade

 if(valorLuz<50){
Serial.print("luminosidade: ");
Serial.println(valorLuz);
delay(500);
digitalWrite(R1,1);
 }
 else{
 Serial.print("luminosidade: ");
 Serial.println(valorLuz);
 delay(500);
 digitalWrite(R1,0);
 }
}

// ==================== FUNÇÃO NOVA: TESTAR COMUNICAÇÃO PZEM ====================
void testarComunicacaoPZEMs() {
  Serial.println("TESTANDO COMUNICAÇÃO COM PZEMs...");
  
  // Testar PZEM 001
  float testeVoltage1 = pzem1.voltage();
  if (!isnan(testeVoltage1)) {
    Serial.printf("PZEM 001 - Conectado! Tensão: %.1f V\n", testeVoltage1);
  } else {
    Serial.println("PZEM 001 - SEM COMUNICAÇÃO!");
    Serial.println("   Verifique: Alimentação 5V, Cabos RX/TX, Conexões");
  }
  
  // Testar PZEM 002
  float testeVoltage2 = pzem2.voltage();
  if (!isnan(testeVoltage2)) {
    Serial.printf("PZEM 002 - Conectado! Tensão: %.1f V\n", testeVoltage2);
  } else {
    Serial.println("PZEM 002 - SEM COMUNICAÇÃO!");
    Serial.println("   Verifique: Alimentação 5V, Cabos RX/TX, Conexões");
  }
  
  Serial.println("-----------------------------------------");
}

  
// ==================== FUNÇÃO NOVA: LER DADOS COM LOGS ====================
void lerDadosPZEMsComLog() {
  static unsigned long ultimoLog = 0;
  
  // Ler dados normalmente
  dadosPzem1.voltage = pzem1.voltage();
  dadosPzem1.current = pzem1.current();
  dadosPzem1.power = pzem1.power();
  dadosPzem1.energy = pzem1.energy();
  dadosPzem1.frequency = pzem1.frequency();
  dadosPzem1.pf = pzem1.pf();
  dadosPzem1.conectado = !isnan(dadosPzem1.voltage);
  
  dadosPzem2.voltage = pzem2.voltage();
  dadosPzem2.current = pzem2.current();
  dadosPzem2.power = pzem2.power();
  dadosPzem2.energy = pzem2.energy();
  dadosPzem2.frequency = pzem2.frequency();
  dadosPzem2.pf = pzem2.pf();
  dadosPzem2.conectado = !isnan(dadosPzem2.voltage);
  
  // Log a cada 10 segundos (para não poluir o serial)
  if (millis() - ultimoLog >= 10000) {
    Serial.println("LEITURA DOS PZEMs:");
    
    if (dadosPzem1.conectado) {
      Serial.printf("PZEM 001 - V: %.1fV, I: %.3fA, P: %.1fW\n", 
                    dadosPzem1.voltage, dadosPzem1.current, dadosPzem1.power);
    } else {
      Serial.println("PZEM 001 - DESCONECTADO");
    }
    
    if (dadosPzem2.conectado) {
      Serial.printf("PZEM 002 - V: %.1fV, I: %.3fA, P: %.1fW\n", 
                    dadosPzem2.voltage, dadosPzem2.current, dadosPzem2.power);
    } else {
      Serial.println("PZEM 002 - DESCONECTADO");
    }
    
    Serial.println("------------------------");
    ultimoLog = millis();
  }
}

// ==================== FUNÇÃO ATUALIZADA: ATUALIZAR NOMES ====================
void atualizarNomesReles() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Sem WiFi - não é possível atualizar nomes");
    return;
  }
  
  WiFiClient client;
  HTTPClient http;
  
  String url = String(serverURL) + "/api/reles?api_key=" + apiKey;
  Serial.print("Buscando nomes em: ");
  Serial.println(url);
  
  http.begin(client, url);
  http.setTimeout(5000); // ⚠️ Timeout de 5 segundos
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    DynamicJsonDocument doc(2048);
    
    DeserializationError error = deserializeJson(doc, response);
    if (error) {
      Serial.print("Erro JSON: ");
      Serial.println(error.c_str());
    } else if (doc["success"] == true) {
      JsonArray relesArray = doc["reles"];
      
      int relesEncontrados = 0;
      for (int i = 0; i < relesArray.size() && i < NUM_RELES; i++) {
        JsonObject rele = relesArray[i];
        nomesReles[i] = rele["nome"].as<String>();
        estadosReles[i] = rele["estado"];
        digitalWrite(pinosReles[i], estadosReles[i] ? HIGH : LOW);
        relesEncontrados++;
      }
      
      Serial.printf("%d relés atualizados do servidor!\n", relesEncontrados);
      
      // Mostrar configuração atual
      Serial.println("CONFIGURAÇÃO DOS RELÉS:");
      for (int i = 0; i < NUM_RELES; i++) {
        Serial.printf("  %d. %s - %s\n", i+1, nomesReles[i].c_str(), 
                      estadosReles[i] ? "LIGADO" : "DESLIGADO");
      }
    } else {
      Serial.println("Servidor retornou success=false");
    }
  } else {
    Serial.print(" Erro HTTP ao buscar relés: ");
    Serial.println(httpCode);
    Serial.println("   Verifique se o servidor Flask está rodando");
  }
  
  http.end();
  ultimaAtualizacaoNomes = millis();
}

// ==================== FUNÇÃO ATUALIZADA: ENVIAR DADOS ====================
void enviarDadosServidor() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado - dados não enviados");
    return;
  }
  
  WiFiClient client;
  HTTPClient http;
  
  DynamicJsonDocument doc(2048);
  doc["api_key"] = apiKey;
  
  // Dados PZEM 001
  JsonObject pzem1Data = doc.createNestedObject("pzem1");
  pzem1Data["voltage"] = dadosPzem1.conectado ? round(dadosPzem1.voltage * 10) / 10.0 : 0.0;
  pzem1Data["current"] = dadosPzem1.conectado ? round(dadosPzem1.current * 1000) / 1000.0 : 0.0;
  pzem1Data["power"] = dadosPzem1.conectado ? round(dadosPzem1.power * 10) / 10.0 : 0.0;
  pzem1Data["energy"] = dadosPzem1.conectado ? round(dadosPzem1.energy * 1000) / 1000.0 : 0.0;
  pzem1Data["frequency"] = dadosPzem1.conectado ? round(dadosPzem1.frequency * 10) / 10.0 : 0.0;
  pzem1Data["pf"] = dadosPzem1.conectado ? round(dadosPzem1.pf * 100) / 100.0 : 0.0;
  pzem1Data["conectado"] = dadosPzem1.conectado;
  
  // Dados PZEM 002
  JsonObject pzem2Data = doc.createNestedObject("pzem2");
  pzem2Data["voltage"] = dadosPzem2.conectado ? round(dadosPzem2.voltage * 10) / 10.0 : 0.0;
  pzem2Data["current"] = dadosPzem2.conectado ? round(dadosPzem2.current * 1000) / 1000.0 : 0.0;
  pzem2Data["power"] = dadosPzem2.conectado ? round(dadosPzem2.power * 10) / 10.0 : 0.0;
  pzem2Data["energy"] = dadosPzem2.conectado ? round(dadosPzem2.energy * 1000) / 1000.0 : 0.0;
  pzem2Data["frequency"] = dadosPzem2.conectado ? round(dadosPzem2.frequency * 10) / 10.0 : 0.0;
  pzem2Data["pf"] = dadosPzem2.conectado ? round(dadosPzem2.pf * 100) / 100.0 : 0.0;
  pzem2Data["conectado"] = dadosPzem2.conectado;
  
  // Estados dos relés
  JsonArray reles = doc.createNestedArray("reles");
  for (int i = 0; i < NUM_RELES; i++) {
    JsonObject rele = reles.createNestedObject();
    rele["id"] = i + 1;
    rele["nome"] = nomesReles[i];
    rele["estado"] = estadosReles[i];
    rele["pino"] = pinosReles[i];
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  String urlCompleta = String(serverURL) + "/api/dados";
  http.begin(client, urlCompleta);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000);
  
  Serial.print("Enviando dados para: ");
  Serial.println(urlCompleta);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Dados enviados com sucesso para o servidor!");
  } else if (httpCode > 0) {
    Serial.print("Erro HTTP no envio: ");
    Serial.println(httpCode);
  } else {
    Serial.print("Falha de conexão: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }
  
  http.end();
  ultimoEnvio = millis();
}

// ==================== FUNÇÕES AUXILIARES (MANTIDAS) ====================
void configurarPinosReles() {
  Serial.println("Configurando pinos dos relés...");
  for (int i = 0; i < NUM_RELES; i++) {
    pinMode(pinosReles[i], OUTPUT);
    digitalWrite(pinosReles[i], LOW);
    Serial.printf("  Rele %d - Pino D%d \n", i+1, pinosReles[i]);
  }
}

void conectarWiFi() {
  Serial.print(" Conectando WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 30) { // ⚠️ Aumentado para 30
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n WiFi conectado!");
    Serial.print("📱 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n Falha na conexão WiFi!");
  }
}

void verificarConexaoWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado - reconectando...");
    conectarWiFi();
  }
}

bool deveEnviarDados() { return (millis() - ultimoEnvio >= intervaloEnvio); }
bool deveVerificarComandos() { return (millis() - ultimaLeituraComandos >= intervaloComandos); }
bool deveAtualizarNomes() { return (millis() - ultimaAtualizacaoNomes >= intervaloAtualizarNomes); }
bool deveMostrarInformacoes() { return (millis() - ultimaInfoSistema >= 300000); }

void verificarComandos() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  WiFiClient client;
  HTTPClient http;
  
  String url = String(serverURL) + "/api/comandos?api_key=" + apiKey;
  http.begin(client, url);
  http.setTimeout(3000);
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    DynamicJsonDocument doc(256);
    deserializeJson(doc, response);
    
    if (doc.containsKey("comando") && doc["comando"] != "") {
      Serial.print("Comando recebido: ");
      Serial.println(doc["comando"].as<String>());
      executarComando(doc["comando"].as<String>());
    }
  }
  
  http.end();
  ultimaLeituraComandos = millis();
}

void executarComando(String comando) {
    comando.trim();
    comando.toUpperCase();

    Serial.print("Comando recebido (bruto): ");
    Serial.println(comando);

    // =============================================
    // 1️⃣ CASO ESPECIAL: comando = "1" ou "0"
    // (controla o relé 1 diretamente)
    // =============================================
    if (comando == "1") {
        controlarRele(0, true);
        Serial.println("🔌 Relé 1 LIGADO (comando curto)");
        return;
    }

    if (comando == "0") {
        controlarRele(0, false);
        Serial.println("🔌 Relé 1 DESLIGADO (comando curto)");
        return;
    }

    // =============================================
    // 2️⃣ Remover caracteres seguros
    // (sem destruir estrutura do comando)
    // =============================================
    comando.replace(" ", "");
    comando.replace("=", "");
    comando.replace(":", "");
    comando.replace("-", "");
    // NÃO remover "_" antes de extrair o ID!

    // Deve começar com RELE
    if (!comando.startsWith("RELE")) {
        Serial.println("⚠️ Comando inválido: não começa com RELE");
        return;
    }

    // =============================================
    // 3️⃣ Extrair número do relé
    // =============================================
    int pos = 4;
    while (pos < comando.length() && isDigit(comando[pos])) {
        pos++;
    }

    if (pos == 4) {
        Serial.println("⚠️ Erro: nenhum número de relé encontrado");
        return;
    }

    int idRele = comando.substring(4, pos).toInt() - 1;

    if (idRele < 0 || idRele >= NUM_RELES) {
        Serial.println("⚠️ Relé fora dos limites!");
        return;
    }

    // =============================================
    // 4️⃣ Extrair ação (ON / OFF / 1 / 0)
    // =============================================
    String acao = comando.substring(pos);
    acao.replace("_", "");  // aqui pode remover

    bool ligar;

    if (acao == "ON" || acao == "1") {
        ligar = true;
    }
    else if (acao == "OFF" || acao == "0") {
        ligar = false;
    }
    else {
        Serial.print("⚠️ Ação inválida: ");
        Serial.println(acao);
        return;
    }

    // =============================================
    // 5️⃣ Executar o comando
    // =============================================
    controlarRele(idRele, ligar);

    Serial.printf("🔌 RELE %d → %s\n", idRele + 1, ligar ? "LIGAR" : "DESLIGAR");
}


void controlarRele(int indiceRele, bool ligar) {
  if (indiceRele >= 0 && indiceRele < NUM_RELES) {
    digitalWrite(pinosReles[indiceRele], ligar ? HIGH : LOW);
    estadosReles[indiceRele] = ligar;
    
    Serial.print("🔌 ");
    Serial.print(nomesReles[indiceRele]);
    Serial.println(ligar ? "  LIGADO" : "  DESLIGADO");
  }
}



void informacoesSistemaCompleta() {
  Serial.println("\n=== 📊 INFORMAÇÕES COMPLETAS ===");
  Serial.print("💾 Heap livre: ");
  Serial.print(ESP.getFreeHeap() / 1024);
  Serial.println(" KB");
  Serial.print("⏰ Uptime: ");
  Serial.print(millis() / 60000);
  Serial.println(" minutos");
  
  Serial.println("🔌 Relés:");
  for (int i = 0; i < NUM_RELES; i++) {
    Serial.printf("  %d. %s - %s\n", i+1, nomesReles[i].c_str(), 
                  estadosReles[i] ? "LIGADO" : "DESLIGADO");
  }
  
  Serial.print("📡 PZEM 001: ");
  Serial.println(dadosPzem1.conectado ? "CONECTADO" : "DESCONECTADO");
  Serial.print("📡 PZEM 002: ");
  Serial.println(dadosPzem2.conectado ? "CONECTADO" : "DESCONECTADO");
  Serial.println("====================================\n");
  
  ultimaInfoSistema = millis();
}