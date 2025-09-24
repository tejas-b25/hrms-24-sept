package com.quantumsoft.hrms.Human_Resource_Website.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AdminRecordNotFoundException.class)
    public ResponseEntity<String> handleAdminRecordNotFound(AdminRecordNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    @ExceptionHandler(FirstTimeLoginException.class)
    public ResponseEntity<String> handleFirstTimeLogin(FirstTimeLoginException e) {
        return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(e.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleResourceNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<CustomResponse> handleIllegalArgumentException(IllegalArgumentException e, HttpServletRequest request) {
        CustomResponse customResponse = new CustomResponse(
                LocalDate.now(),
                LocalTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST,
                e.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(customResponse, HttpStatus.BAD_REQUEST);
    }
//    @ExceptionHandler(ResourceNotFoundException.class)
//    public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
//        Map<String, String> error = new HashMap<>();
//        error.put("message", ex.getMessage());
//        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
//    }

//    @ExceptionHandler(IllegalArgumentException.class)
//    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
//        Map<String, String> error = new HashMap<>();
//        error.put("message", ex.getMessage());
//        return ResponseEntity.badRequest().body(error);
//    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage() != null ? ex.getMessage() : "Unexpected error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

}
