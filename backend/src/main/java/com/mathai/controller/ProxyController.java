package com.mathai.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.Enumeration;

/**
 * Proxies all /api/** requests to the Python AI service.
 * JWT is validated by JwtFilter before this controller is reached.
 * SSE endpoints stream bytes directly through; JSON endpoints buffer and return.
 */
@RestController
public class ProxyController {

    @Value("${mathai.ai.base-url}")
    private String aiBaseUrl;

    /** SSE streaming endpoint — passes bytes through without buffering */
    @PostMapping(value = "/api/solve", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public StreamingResponseBody proxySolveStream(
        HttpServletRequest request,
        @RequestBody byte[] body,
        Authentication auth
    ) {
        return outputStream -> forward(request, body, outputStream, "/api/solve");
    }

    @PostMapping(value = "/api/practice/grade", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public StreamingResponseBody proxyGradeStream(
        HttpServletRequest request,
        @RequestBody byte[] body,
        Authentication auth
    ) {
        return outputStream -> forward(request, body, outputStream, "/api/practice/grade");
    }

    /** Standard JSON proxy for all other /api/** routes */
    @RequestMapping("/api/**")
    public StreamingResponseBody proxyGeneric(
        HttpServletRequest request,
        @RequestBody(required = false) byte[] body,
        Authentication auth
    ) {
        String path = request.getRequestURI();
        return outputStream -> forward(request, body, outputStream, path);
    }

    private void forward(HttpServletRequest request, byte[] body, OutputStream out, String path) throws IOException {
        URI uri = URI.create(aiBaseUrl + path +
            (request.getQueryString() != null ? "?" + request.getQueryString() : ""));

        HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
        conn.setRequestMethod(request.getMethod());
        conn.setDoInput(true);
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(0); // no timeout for streaming

        // forward content-type
        String ct = request.getContentType();
        if (ct != null) conn.setRequestProperty("Content-Type", ct);

        // forward body if present
        if (body != null && body.length > 0) {
            conn.setDoOutput(true);
            conn.getOutputStream().write(body);
        }

        int status = conn.getResponseCode();
        InputStream is = status >= 400 ? conn.getErrorStream() : conn.getInputStream();

        if (is != null) {
            byte[] buf = new byte[4096];
            int n;
            while ((n = is.read(buf)) != -1) {
                out.write(buf, 0, n);
                out.flush();
            }
        }
    }
}
