package com.quantumsoft.hrms.Human_Resource_Website.serviceImpl;


import com.quantumsoft.hrms.Human_Resource_Website.entity.Admin;
import com.quantumsoft.hrms.Human_Resource_Website.enums.Status;
import com.quantumsoft.hrms.Human_Resource_Website.repository.AdminRepository;
import com.quantumsoft.hrms.Human_Resource_Website.repository.AuditLogRepository;
import com.quantumsoft.hrms.Human_Resource_Website.service.AdminService;
import com.quantumsoft.hrms.Human_Resource_Website.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.quantumsoft.hrms.Human_Resource_Website.security.JwtTokenUtil;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static com.quantumsoft.hrms.Human_Resource_Website.enums.Role.ADMIN;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    public String login(String username, String password) {
        Optional<Admin> adminOpt = adminRepository.findByUsernameIgnoreCase(username);

        // If username does not exist
        if (adminOpt.isEmpty()) {
            // Optional: check if password also wrong -> treat as "both incorrect"
            if (!passwordEncoder.matches(password, "dummyHashValue")) {
                throw new RuntimeException("Username and password are incorrect");
            }
            throw new RuntimeException("Username is incorrect");
        }

        Admin admin = adminOpt.get();

        if (admin.getStatus() == Status.INACTIVE) {
            throw new RuntimeException("Account is INACTIVE");
        }

        if (!passwordEncoder.matches(password, admin.getPassword())) {
            throw new RuntimeException("Password is incorrect");
        }

        // update last login
        admin.setUpdatedAt(LocalDateTime.now());
        admin.setLastlogin(LocalDateTime.now());
        adminRepository.save(admin);

        // log event
        auditLogService.logEvent(admin.getUsername(), "LOGIN");

        // set claims
        Map<String, Object> claims = Map.of(
                "role", admin.getRole().name()
        );

        return jwtTokenUtil.generateToken(admin.getUsername(), claims);
    }

    @Override
    public void createDefaultAdmin() {
        if (!adminRepository.existsByRole(ADMIN)) {
            Admin admin = new Admin();
            admin.setUsername("admin");
            admin.setEmail("admin@hrms.com");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(ADMIN);
            admin.setStatus(Status.ACTIVE);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            adminRepository.save(admin);
        }
    }
}