package com.mathai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

@Document(collection = "solve_history")
public class SolveHistory {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String problem;
    private String latexResult;
    private String vizType;

    @CreatedDate
    private Instant solvedAt;

    public SolveHistory() {}

    public SolveHistory(String userId, String problem, String latexResult, String vizType) {
        this.userId = userId;
        this.problem = problem;
        this.latexResult = latexResult;
        this.vizType = vizType;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getProblem() { return problem; }
    public String getLatexResult() { return latexResult; }
    public String getVizType() { return vizType; }
    public Instant getSolvedAt() { return solvedAt; }

    public void setId(String id) { this.id = id; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setProblem(String problem) { this.problem = problem; }
    public void setLatexResult(String latexResult) { this.latexResult = latexResult; }
    public void setVizType(String vizType) { this.vizType = vizType; }
    public void setSolvedAt(Instant solvedAt) { this.solvedAt = solvedAt; }
}
