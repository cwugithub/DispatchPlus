package dispatchPlus;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;

import dispatchPlus.filter.CorsFilter;
import dispatchPlus.filter.LoginFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.session.SessionManagementFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.Arrays;


@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private DataSource dataSource;

    private final CustomLoginHandler customLoginHandler = new CustomLoginHandler();
    private final CustomLogoutHandler customLogoutHandler = new CustomLogoutHandler();

    @Bean
    CorsConfigurationSource corsConfigurationSource()
    {
        CorsConfiguration configuration = new CorsConfiguration();
        // set response header with
        // Access-Control-Allow-Origin: http://localhost:3000
        // Access-Control-Allow-Credentials:true
        // Access-Control-Allow-Headers: Content-Type
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        //configuration.setAllowedOrigins(Arrays.asList("http://dispatchplusv1.s3-website-us-west-1.amazonaws.com"));
        configuration.setAllowedMethods(Arrays.asList("GET","POST","OPTIONS"));
        configuration.setAllowCredentials(true);
        configuration.setAllowedHeaders(Arrays.asList("Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // authority configuration
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        LoginFilter loginFilter = new LoginFilter();
        loginFilter.setAuthenticationManager(authenticationManager());
        loginFilter.setFilterProcessesUrl("/login");
        loginFilter.setAuthenticationSuccessHandler(customLoginHandler);
        loginFilter.setAuthenticationFailureHandler(customLoginHandler);
        http
                .cors().and()
                .csrf().disable()
                .addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class);

        http
                .authorizeRequests()
                //.antMatchers("/cart/**").hasAuthority("ROLE_USER")
                //.antMatchers("/get*/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")
                .antMatchers("/admin*/**").hasAuthority("ROLE_ADMIN")
                .antMatchers( "/login", "/logout", "/registration").permitAll()
                .anyRequest().authenticated();


        http
                .logout()
                .logoutUrl("/logout") // set the url that triggers logout
                .addLogoutHandler(customLogoutHandler)
                .logoutSuccessHandler(customLogoutHandler);

    }
    // authentication configuration
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth
                .jdbcAuthentication()
                .dataSource(dataSource)
                .usersByUsernameQuery("SELECT emailId, password, enabled FROM Users WHERE emailId=?")
                .authoritiesByUsernameQuery("SELECT emailId, authorities FROM Authorities WHERE emailId=?");

    }

    @SuppressWarnings("deprecation")
    @Bean
    public static NoOpPasswordEncoder passwordEncoder() {
        return (NoOpPasswordEncoder) NoOpPasswordEncoder.getInstance();
    }

    public static class CustomLoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {
        // Login Success
        @Override
        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
            response.getWriter().print("login succeed");
        }
        // Login Failure
        @Override
        public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().print("login failed");
        }
    }
    public static class CustomLogoutHandler implements LogoutHandler, LogoutSuccessHandler {
        @Override
        public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
            response.setStatus(HttpServletResponse.SC_OK);
        }

        @Override
        public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
            response.getWriter().print("logged out successfully");
        }
    }

}
