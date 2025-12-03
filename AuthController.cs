using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RabbitaskWebAPI.Data;
using RabbitaskWebAPI.DTOs.Common;
using RabbitaskWebAPI.Models;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using PhoneNumbers;

namespace RabbitaskWebAPI.Controllers
{
    [Route("api/[controller]")]
    public class AuthController : BaseController
    {
        private readonly RabbitaskContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(
            RabbitaskContext context, 
            IConfiguration configuration,
            ILogger<AuthController> logger)
            : base(logger)
        {
            _context = context;
            _configuration = configuration;
        }

        /// <summary>
        /// Autentica um usuário e retorna um token JWT
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<RespostaSessaoDto>>> Autenticar([FromBody] CredenciaisDto credenciaisDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var erros = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToArray();
                    return RespostaErro<RespostaSessaoDto>(400, "Dados inválidos", erros);
                }

                var senhaHash = HasherSenha.Hash(credenciaisDto.Senha);
                var usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.NmEmail == credenciaisDto.Email && u.NmSenha == senhaHash);

                if (usuario == null)
                {
                    _logger.LogWarning("Tentativa de autenticação falhou para email: {Email}", credenciaisDto.Email);
                    return RespostaErro<RespostaSessaoDto>(401, "Credenciais inválidas");
                }

                var token = GerarTokenJwt(usuario);

                _logger.LogInformation("Usuário {UserId} autenticado com sucesso", usuario.CdUsuario);

                return RespostaSucesso(new RespostaSessaoDto 
                { 
                    Token = token,
                    CdUsuario = usuario.CdUsuario,
                    NmUsuario = usuario.NmUsuario,
                    Email = usuario.NmEmail
                }, "Autenticação realizada com sucesso");
            }
            catch (Exception ex)
            {
                return TratarExcecao<RespostaSessaoDto>(ex, nameof(Autenticar));
            }
        }

        /// <summary>
        /// Registra um novo usuário no sistema
        /// </summary>
        [HttpPost("cadastrar")]
        public async Task<ActionResult<ApiResponse<RespostaCadastroDto>>> Cadastrar([FromBody] DadosCadastroDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var erros = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToArray();
                    return RespostaErro<RespostaCadastroDto>(400, "Dados inválidos", erros);
                }

                // Validar email único
                if (await _context.Usuarios.AnyAsync(u => u.NmEmail == dto.NmEmail))
                {
                    return RespostaErro<RespostaCadastroDto>(409, "Email já está em uso");
                }

                // Validar tipo de usuário
                if (!await _context.TipoUsuarios.AnyAsync(t => t.CdTipoUsuario == dto.CdTipoUsuario))
                {
                    return RespostaErro<RespostaCadastroDto>(400, "Tipo de usuário inválido");
                }

                // Validar e formatar telefone
                var telefoneValidado = await ValidarTelefone(dto.CdTelefone);
                if (telefoneValidado == null)
                {
                    return RespostaErro<RespostaCadastroDto>(400, "Telefone inválido");
                }

                // Verificar telefone único
                if (await _context.Usuarios.AnyAsync(u => u.CdTelefone == telefoneValidado))
                {
                    return RespostaErro<RespostaCadastroDto>(409, "Telefone já está em uso");
                }

                // Validar senha
                var senhaErros = ValidarSenha(dto.NmSenha);
                if (senhaErros.Any())
                {
                    return RespostaErro<RespostaCadastroDto>(400, "Senha não atende aos requisitos", senhaErros.ToArray());
                }

                // Criar usuário
                var usuario = new Usuario
                {
                    NmUsuario = dto.NmUsuario.Trim(),
                    NmEmail = dto.NmEmail.Trim().ToLower(),
                    NmSenha = HasherSenha.Hash(dto.NmSenha),
                    CdTelefone = telefoneValidado,
                    CdTipoUsuario = dto.CdTipoUsuario
                };

                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Novo usuário cadastrado: {UserId} - {Email}", usuario.CdUsuario, usuario.NmEmail);

                return RespostaSucesso(new RespostaCadastroDto
                {
                    CdUsuario = usuario.CdUsuario,
                    NmUsuario = usuario.NmUsuario,
                    Email = usuario.NmEmail
                }, "Cadastro realizado com sucesso");
            }
            catch (Exception ex)
            {
                return TratarExcecao<RespostaCadastroDto>(ex, nameof(Cadastrar));
            }
        }

        #region Métodos Auxiliares

        /// <summary>
        /// Gera um token JWT para o usuário autenticado
        /// </summary>
        private string GerarTokenJwt(Usuario usuario)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.CdUsuario.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuario.NmEmail),
                new Claim(ClaimTypes.NameIdentifier, usuario.CdUsuario.ToString()),
                new Claim(ClaimTypes.Email, usuario.NmEmail),
                new Claim(ClaimTypes.Name, usuario.NmUsuario)
            };

            var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT_KEY"]));
            var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT_ISSUER"],
                audience: _configuration["JWT_AUDIENCE"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2), 
                signingCredentials: credenciais);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Valida e formata um número de telefone brasileiro
        /// </summary>
        private async Task<string?> ValidarTelefone(string telefone)
        {
            try
            {
                PhoneNumberUtil numberUtil = PhoneNumberUtil.GetInstance();
                PhoneNumber numeroTelefone = numberUtil.Parse(telefone, "BR");

                if (!numberUtil.IsValidNumber(numeroTelefone))
                {
                    return null;
                }

                return numberUtil.Format(numeroTelefone, PhoneNumberFormat.E164);
            }
            catch (NumberParseException ex)
            {
                _logger.LogWarning("Erro ao validar telefone: {Telefone}. Erro: {Message}", telefone, ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Valida requisitos de senha forte
        /// </summary>
        private List<string> ValidarSenha(string senha)
        {
            var erros = new List<string>();

            if (string.IsNullOrWhiteSpace(senha))
            {
                erros.Add("Senha é obrigatória");
                return erros;
            }

            if (senha.Length < 8)
                erros.Add("Senha deve ter no mínimo 8 caracteres");

            if (senha.Length > 100)
                erros.Add("Senha deve ter no máximo 100 caracteres");

            if (!senha.Any(char.IsUpper))
                erros.Add("Senha deve conter pelo menos uma letra maiúscula");

            if (!senha.Any(char.IsLower))
                erros.Add("Senha deve conter pelo menos uma letra minúscula");

            if (!senha.Any(char.IsDigit))
                erros.Add("Senha deve conter pelo menos um número");

            if (!senha.Any(c => !char.IsLetterOrDigit(c)))
                erros.Add("Senha deve conter pelo menos um caractere especial");

            return erros;
        }

        #endregion
    }

    #region DTOs

    public class CredenciaisDto
    {
        [Required(ErrorMessage = "Email é obrigatório")]
        [EmailAddress(ErrorMessage = "Email inválido")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Senha é obrigatória")]
        public string Senha { get; set; }
    }

    public class RespostaSessaoDto
    {
        public string Token { get; set; }
        public int CdUsuario { get; set; }
        public string NmUsuario { get; set; }
        public string Email { get; set; }
    }

    public class DadosCadastroDto
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Nome deve ter entre 3 e 100 caracteres")]
        public string NmUsuario { get; set; }

        [Required(ErrorMessage = "Email é obrigatório")]
        [EmailAddress(ErrorMessage = "Email inválido")]
        public string NmEmail { get; set; }

        [Required(ErrorMessage = "Senha é obrigatória")]
        public string NmSenha { get; set; }

        [Required(ErrorMessage = "Telefone é obrigatório")]
        [Phone(ErrorMessage = "Telefone inválido")]
        public string CdTelefone { get; set; }

        [Required(ErrorMessage = "Tipo de usuário é obrigatório")]
        [Range(1, int.MaxValue, ErrorMessage = "Tipo de usuário inválido")]
        public int CdTipoUsuario { get; set; }
    }

    public class RespostaCadastroDto
    {
        public int CdUsuario { get; set; }
        public string NmUsuario { get; set; }
        public string Email { get; set; }
    }

    #endregion
}
